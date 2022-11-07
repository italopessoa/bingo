var AWS = require('aws-sdk')
const { DynamoDBClient, UpdateItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
let client = new DynamoDBClient();

async function onConnect({ queryStringParameters, requestContext: { connectionId } }) {
    let { executionName, playerId, playerName } = queryStringParameters;
    try {
        console.log(`Trying to update player: ${playerId} on Execution: ${executionName}`);

        let command = buildUpdateCommand(executionName, playerId, connectionId);
        await updateConnectionId(command);

        await notifyBingo({ messageType: 'USER_CONNECTED', playerId, playerName });

        return {
            statusCode: 200
        }
    } catch (error) {
        console.log("Error when trying to update player connection: ", error);
        return {
            statusCode: 500,
            body: {
                message: "Error when trying to connect"
            }
        }
    }
}

async function onDisconnect({ requestContext: { connectionId } }) {
    try {
        var player = await getPlayerByConnectionId(connectionId);

        console.log(`Trying to diconnect player: ${player.UserName} from Execution: ${player.BingoExecutionName}, ConnectionId: ${connectionId}`);
        let command = buildUpdateCommand(player.BingoExecutionName, player.PlayerId, '');

        await updateConnectionId(command);

        await notifyBingo({ messageType: 'USER_DISCONNECTED', playerId: player.PlayerId });

        return {
            statusCode: 200
        }
    } catch (error) {
        console.error("Error on disconnectind: ", error);
        return {
            statusCode: 500,
            body: {
                message: "Error when trying to disconnect."
            }
        }
    }
}

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

async function updateConnectionId(command) {
    try {
        await client.send(command);
        console.log("Player connection updated");
    } catch (error) {
        console.error("Error when trying to update player connection: ", error);
        throw error;
    }
}

async function getPlayerByConnectionId(connectionId) {
    var output = {};

    try {
        output = await client.send(buildScanPlayerCommand(connectionId));
    } catch (error) {
        console.error("Error when trying to get player by ConnectionId: ", connectionId);
        console.error(error);
        throw error;
    }

    if (output.Count > 0) {
        return mapDynamoDBPlayerItemToJson(output.Items[0])
    } else {
        console.log("Player not found");
    }
    return {};
}

function buildScanPlayerCommand(connectionId) {
    return new ScanCommand({
        TableName: process.env.TABLE_NAME,
        ProjectionExpression: "BingoExecutionName, PlayerId, ConnectionId, UserName",
        Limit: 1,
        FilterExpression: "ConnectionId = :connectionId",
        ExpressionAttributeValues: {
            ":connectionId": { S: connectionId }
        }
    });
}

function mapDynamoDBPlayerItemToJson(item) {
    return {
        PlayerId: item.PlayerId.S,
        BingoExecutionName: item.BingoExecutionName.S,
        ConnectionId: item.ConnectionId.S,
        UserName: item.UserName.S
    }
}

async function notifyBingo(message) {
    await AWS.SNS({ apiVersion: '2010-03-31' })
        .publish({
            Message: message,
            TopicArn: process.env.TOPIC_ARN
        })
        .promise();
}

exports.ondisconnect_handler = onDisconnect;
exports.onconnect_handler = onConnect;