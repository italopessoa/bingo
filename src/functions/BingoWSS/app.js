const { DynamoDBClient, UpdateItemCommand, ScanCommandInpt, ScanCommand } = require("@aws-sdk/client-dynamodb");
const TABLE_NAME = "BingoTicket";

async function onConnect({ queryStringParameters, requestContext: { connectionId } }) {
    let { executionName, playerId } = queryStringParameters;
    try {
        console.log(`Trying to update player: ${playerId} on Execution: ${executionName}`);
        let command = buildUpdateCommand(executionName, playerId, connectionId);
        await updateConnectionId(command);
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

async function onDisconnect(event) {
    console.log(event);
    const { requestContext: { connectionId } } = event;
    try {
        var player = await getPlayerByConnectionId(connectionId);
        console.log(`Trying to diconnect player: ${player.UserName} from Execution: ${player.BingoExecutionName}`);
        let command = buildUpdateCommand(player.BingoExecutionName, player.PlayerId, player.ConnectionId);
        await updateConnectionId(command);
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

async function updateConnectionId(command) {
    try {
        let client = new DynamoDBClient();
        await client.send(command);

        console.log("Player connection updated");
    } catch (error) {
        console.error("Error when trying to update player connection: ", error);
        throw error;
    }
}

async function getPlayerByConnectionId(connectionId) {
    try {
        var command = buildScanPlayerCommand(connectionId);
        let client = new DynamoDBClient();
        let response = await client.send(command);
        return response.Count > 0 ? response.Items[0] : null;
    } catch (error) {
        console.error("Error when trying to get player by ConnectionId: ", connectionId);
        console.error(error);
        throw error;
    }
}

function buildScanPlayerCommand(connectionId) {
    return new ScanCommand({
        TableName: TABLE_NAME,
        AttributesToGet: "BingoExecutionName, PlayerId, ConnectionId",
        ProjectionExpression: "BingoExecutionName, PlayerId, ConnectionId",
        Limit: 1,
        FilterExpression: "ConnectionId = :connectionId",
        ExpressionAttributeValues: {
            ":connectionId": { S: connectionId }
        }
    });
}

exports.ondisconnect_handler = onDisconnect;
exports.onconnect_handler = onConnect;