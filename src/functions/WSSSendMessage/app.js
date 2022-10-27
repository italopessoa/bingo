const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const ddbClient = new DynamoDBClient();

exports.handler = async (event) => {
    console.log(event)
    let messageData = JSON.parse(event.message).data;
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
                requestContext: event.requestContext,
                messageData,
                connectionId: ConnectionId
            });
        } catch (error) {
            if (e.statusCode === 410) {
                console.error(`Found stale connection, deleting ${ConnectionId}`);
                await ddbClient.send(buildUpdateCommand(BingoExecutionName, PlayerId, ''));
            } else {
                console.error(`Error when trying to send message to connection: ${ConnectionId}-${UserName}`);
                throw e;
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
    let apiGtwManagementApiClient = new ApiGatewayManagementApiClient({
        apiVersion: '2018-11-29',
        endpoint: `${params.requestContext.domainName} / ${params.requestContext.stage}`
    });

    await apiGtwManagementApiClient.send(new PostToConnectionCommand({
        ConnectionId: params.connectionId, Data: params.messageData
    }
    ));
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