var AWS = require('aws-sdk')
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { buildUpdateBingoTicketCommand } = require('../Services/DynamoDBCommandsHelper');
let client = new DynamoDBClient();

async function onConnect({ queryStringParameters, requestContext: { connectionId } }) {
    let { executionName, playerId, playerName } = queryStringParameters;
    try {
        console.log(`Trying to update player: ${playerId} on Execution: ${executionName}`);

        let command = buildUpdateBingoTicketCommand(executionName, playerId, connectionId);
        await updateConnectionId(command);

        await notifyBingo({
            data: {
                bingoExecutionName: executionName,
                type: 'USER_CONNECTED',
                player: {
                    id: playerId,
                    name: playerName,
                },
                connectionId
            }
        });

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
        let command = buildUpdateBingoTicketCommand(player.BingoExecutionName, player.PlayerId, 'disconnected');

        await updateConnectionId(command);

        await notifyBingo({
            data: {
                bingoExecutionName: player.BingoExecutionName,
                type: 'USER_DISCONNECTED',
                player: {
                    id: player.PlayerId,
                    name: player.UserName
                },
                connectionId
            }
        });

        return {
            statusCode: 200
        }
    } catch (error) {
        console.error("Error on disconnecting: ", error);
        return {
            statusCode: 500,
            body: {
                message: "Error when trying to disconnect."
            }
        }
    }
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
    await new AWS.SNS({ apiVersion: '2010-03-31' })
        .publish({
            Message: JSON.stringify(message),
            TopicArn: process.env.TOPIC_ARN
        })
        .promise();
}

exports.ondisconnect_handler = onDisconnect;
exports.onconnect_handler = onConnect;