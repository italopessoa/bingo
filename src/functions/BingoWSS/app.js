const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

async function onConnect(event) {
    const { queryStringParameters, connectionId } = event;
    var client = new DynamoDBClient();

    const command = new UpdateItemCommand({
        TableName: "BingoTicket",
        Key: {
            BingoExecutionName: { "S": queryStringParameters.executionName }, // For example, 'Season': {N:2}.
            PlayerId: { "S": queryStringParameters.playerId } // For example,  'Episode': {S: "The return"}; (only required if table has sort key).
        },
        UpdateExpression: "set ConnectionId = :connection", // For example, "'set Title = :t, Subtitle = :s'"
        ExpressionAttributeValues: {
            ":connection": connectionId // For example ':t' : 'NEW_TITLE'
        }
    })

    try {

        await client.send(command);
        console.log("Client connected");
        return {
            statusCode: 200
        }
    } catch (error) {
        console.log("Error when trying to update player connection: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
}

async function onDisconnect(event) {

}

exports.ondisconnect_handler = onDisconnect;
exports.onconnect_handler = onConnect;