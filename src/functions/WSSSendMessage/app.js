const AWS = require('aws-sdk');
const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const ddbClient = new DynamoDBClient();
const STAGE = 'dev';

exports.handler = async (event) => {
    let snsMessage = JSON.parse(event.Records[0].Sns.Message).data;
    console.log(snsMessage);
    let connections = [];

    try {
        connections = await getActiveConnections(snsMessage.bingoExecutionName);
    } catch (error) {
        console.error("Error when trying to get active connections: ", error);
        return { statusCode: 500, body: 'Error when trying to get active connections' };
    }

    let postCalls = connections.map(async ({ BingoExecutionName, PlayerId, ConnectionId, UserName }) => {
        try {
            await sendMessage({
                messageData: JSON.stringify(snsMessage),
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
        console.error("Error when sending messages: ", error);
        return { statusCode: 500, body: "Error when sending messages" };
    }

    return { statusCode: 200, body: 'Data sent.' };
}

async function getActiveConnections(bingoExecutionName) {
    try {
        let command = new ScanCommand({
            TableName: process.env.TABLE_NAME,
            ProjectionExpression: "BingoExecutionName, PlayerId, ConnectionId, UserName",
            FilterExpression: "BingoExecutionName = :bingoExecutionName",
            ExpressionAttributeValues: {
                ":bingoExecutionName": { S: bingoExecutionName }
            }
        });
        
        let result = await ddbClient.send(command);
        return result.Items.map(item => ({
            BingoExecutionName: item.BingoExecutionName.S,
            ConnectionId: item.ConnectionId.S,
            PlayerId: item.PlayerId.S,
            UserName: item.UserName.S
        }));
    } catch (error) {
        console.error("Error when trying to get active connections: ", error);
        throw error;
    }
}

async function sendMessage(params) {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `${process.env.WEBSOCKET_DOMAN}/${STAGE}`
    });
    await apigwManagementApi.postToConnection({ ConnectionId: params.connectionId, Data: params.messageData }).promise();
}

//TODO: duplicated
function buildUpdateCommand(executionName, playerId, connectionId) {
    return new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
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