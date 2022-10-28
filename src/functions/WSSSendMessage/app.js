const AWS = require('aws-sdk');
const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const ddbClient = new DynamoDBClient();
const TABLE_NAME = "BingoTicket";

exports.handler = async (event) => {
    console.log(event);
    let connections = [];

    try {
        connections = await getActiveConnections(event.bingoExecutionName);
    } catch (error) {
        console.error("Error when trying to get active connections: ", error);
        return { statusCode: 500, body: 'Error when trying to get active connections' };
    }

    let postCalls = connections.map(async ({ BingoExecutionName, PlayerId, ConnectionId, UserName }) => {
        try {
            await sendMessage({
                stage: 'dev',
                domainName: 'y9hit3fxl7.execute-api.sa-east-1.amazonaws.com',
                messageData: event.message,
                connectionId: ConnectionId
            });
        } catch (error) {
            if (error.statusCode === 410) {
                console.error(`Found stale connection, deleting ${ConnectionId}`);
                await ddbClient.send(buildUpdateCommand(BingoExecutionName, PlayerId, ''));
            } else {
                console.error(`Error when trying to send message to connection: ${ConnectionId}-${UserName}`);
                throw error;
            }
        }
    });

    try {
        await Promise.all(postCalls);
    } catch (error) {
        return { statusCode: 500, body: "Error when sending messages" };
    }

    return { statusCode: 200, body: 'Data sent.' };
}

async function getActiveConnections(bingoExecutionName) {
    try {
        let command = new ScanCommand({
            TableName: TABLE_NAME,
            ProjectionExpression: "BingoExecutionName, PlayerId, ConnectionId, UserName",
            FilterExpression: "BingoExecutionName = :bingoExecutionName",
            ExpressionAttributeValues: {
                ":bingoExecutionName": { S: bingoExecutionName }
            }
        });
        return (await ddbClient.send(command)).Items;
    } catch (error) {
        console.error("Error when trying to get active connections: ", error);
        throw error;
    }
}

async function sendMessage(params) {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `${params.domainName} / ${params.stage}`
    });
    await apigwManagementApi.postToConnection({ ConnectionId: params.connectionId, Data: params.messageData }).promise();
}

//TODO: duplicated
function buildUpdateCommand(executionName, playerId, connectionId) {
    return new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
            BingoExecutionName: { S: executionName },
            PlayerId: { S: playerId }
        },
        UpdateExpression: "SET ConnectionId = :connectionId",
        ExpressionAttributeValues: {
            ":connectionId": { S: connectionId }
        }
    });
}