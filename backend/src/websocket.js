const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "BattleConnections";

exports.connectHandler = async (event) => {
    try {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                connectionId: event.requestContext.connectionId
            }
        }));
        return { statusCode: 200, body: 'Connected.' };
    } catch (err) {
        console.error("Connect Error:", err);
        return { statusCode: 500, body: 'Failed to connect: ' + err.message };
    }
};

exports.disconnectHandler = async (event) => {
    try {
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                connectionId: event.requestContext.connectionId
            }
        }));
        return { statusCode: 200, body: 'Disconnected.' };
    } catch (err) {
        console.error("Disconnect Error:", err);
        return { statusCode: 500, body: 'Failed to disconnect: ' + err.message };
    }
};

exports.sendMessageHandler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { progress, name } = body;
        
        // Scan for all connections (For MVP, we just broadcast to all others)
        const connectionsData = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME
        }));

        const apigwManagementApi = new ApiGatewayManagementApiClient({
            apiVersion: '2018-11-29',
            endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
        });

        const postCalls = connectionsData.Items.map(async ({ connectionId }) => {
            if (connectionId !== event.requestContext.connectionId) {
                try {
                    await apigwManagementApi.send(new PostToConnectionCommand({
                        ConnectionId: connectionId,
                        Data: JSON.stringify({ type: 'progress', progress, name })
                    }));
                } catch (e) {
                    if (e.statusCode === 410) {
                        console.log(`Found stale connection, deleting ${connectionId}`);
                        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { connectionId } }));
                    } else {
                        throw e;
                    }
                }
            }
        });

        await Promise.all(postCalls);
        return { statusCode: 200, body: 'Data sent.' };
    } catch (err) {
        console.error("Send Message Error:", err);
        return { statusCode: 500, body: 'Failed to send message: ' + err.message };
    }
};
