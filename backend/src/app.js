const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const RESULTS_TABLE = process.env.RESULTS_TABLE;
const USER_STATS_TABLE = process.env.USER_STATS_TABLE;
const { GoogleGenAI } = require('@google/genai');

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

        // Update UserStats
        let userStats = { userId, history: {}, categories: {} };
        try {
            const statsData = await docClient.send(new QueryCommand({
                TableName: USER_STATS_TABLE,
                KeyConditionExpression: "userId = :uid",
                ExpressionAttributeValues: { ":uid": userId }
            }));
            if (statsData.Items && statsData.Items.length > 0) {
                userStats = statsData.Items[0];
            }
        } catch (e) { console.error("Error fetching UserStats", e); }

        // Update history (heatmap)
        const dateStr = timestamp.split('T')[0];
        if (!userStats.history) userStats.history = {};
        userStats.history[dateStr] = (userStats.history[dateStr] || 0) + 1;

        // Update categories (Radar chart)
        if (!userStats.categories) userStats.categories = { "DSA": 0, "Logical": 0, "DBMS": 0 };
        // For simplicity, we boost a random category
        const cats = ["DSA", "Logical", "DBMS", "System Design"];
        const randCat = cats[Math.floor(Math.random() * cats.length)];
        userStats.categories[randCat] = Math.min(100, (userStats.categories[randCat] || 50) + 5);

        await docClient.send(new PutCommand({
            TableName: USER_STATS_TABLE,
            Item: userStats
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

exports.getProfileStatsHandler = async (event) => {
    try {
        const userId = event.pathParameters?.userId;
        if (!userId) return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };

        const data = await docClient.send(new QueryCommand({
            TableName: USER_STATS_TABLE,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": userId }
        }));
        
        let stats = data.Items && data.Items.length > 0 ? data.Items[0] : { userId, history: {}, categories: {} };
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(stats)
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

exports.evaluateSpeechHandler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { audioBase64, scenario, text, mimeType } = body;
        
        if (!audioBase64 && !text) {
             return { statusCode: 400, body: JSON.stringify({ error: "Missing audio or text" }) };
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `You are an elite corporate speech and communication evaluator.
The user was asked to read the following target corporate scenario:
"${scenario || "None provided"}"

Listen to the audio recording. Transcribe what the candidate spoke word-for-word, and evaluate their speech for Pronunciation (clarity), Fluency (pace and rhythm), and Vocabulary (professional tone).
Output strictly a JSON object with:
- "transcript": Exact word-for-word transcription of what was spoken in the audio.
- "pronunciation": Number from 0 to 100.
- "fluency": Number from 0 to 100.
- "vocabulary": Number from 0 to 100.
- "overall": Number from 0 to 100.
- "feedback": Concise summary analysis of their spoken delivery.
- "improvements": An array of 2 to 4 specific, actionable tips (strings) for how the user can improve their verbal delivery and score.`;

        let contents = prompt;
        if (audioBase64) {
            const cleanMime = (mimeType && mimeType.split(';')[0]) || "audio/webm";
            contents = [
                {
                    inlineData: {
                        mimeType: cleanMime,
                        data: audioBase64
                    }
                },
                prompt
            ];
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: contents,
            config: {
                responseMimeType: "application/json"
            }
        });

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: response.text
        };
    } catch (err) {
        console.error("evaluateSpeechHandler error:", err);
        return {
            statusCode: 500,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({ error: err.message || "Internal Server Error" })
        };
    }
};
