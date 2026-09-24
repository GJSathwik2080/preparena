const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const RESULTS_TABLE = process.env.RESULTS_TABLE;

exports.getQuestionsHandler = async (event) => {
    try {
        const testId = event.pathParameters?.testId;
        if (!testId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing testId" }) };
        }

        const data = await docClient.send(new QueryCommand({
            TableName: QUESTIONS_TABLE,
            KeyConditionExpression: "testId = :tid",
            ExpressionAttributeValues: {
                ":tid": testId
            }
        }));

        // Do not return correct answers to frontend
        const sanitizedQuestions = data.Items.map(q => {
            const { correctAnswer, ...rest } = q;
            return rest;
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sanitizedQuestions)
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};

exports.submitResultHandler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userId, testId, answers } = body; // answers is { questionId: "A", ... }
        
        if (!userId || !testId || !answers) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        // Fetch questions to grade
        const questionsData = await docClient.send(new QueryCommand({
            TableName: QUESTIONS_TABLE,
            KeyConditionExpression: "testId = :tid",
            ExpressionAttributeValues: {
                ":tid": testId
            }
        }));

        const questions = questionsData.Items;
        let score = 0;
        const total = questions.length;
        const gradedResults = [];

        for (const q of questions) {
            const userAnswer = answers[q.questionId];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) score++;
            
            gradedResults.push({
                questionId: q.questionId,
                userAnswer: userAnswer || null,
                correctAnswer: q.correctAnswer,
                isCorrect
            });
        }

        const timestamp = new Date().toISOString();

        // Save result
        await docClient.send(new PutCommand({
            TableName: RESULTS_TABLE,
            Item: {
                userId,
                timestamp,
                testId,
                score,
                total,
                details: gradedResults
            }
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ score, total, timestamp, details: gradedResults })
        };

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
