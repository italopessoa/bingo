const { ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

function buildScanActiveConnectionsCommand(bingoExecutionName) {
    return new ScanCommand({
        TableName: process.env.TABLE_NAME,
        ProjectionExpression: "BingoExecutionName, PlayerId, ConnectionId, UserName",
        FilterExpression: "BingoExecutionName = :bingoExecutionName AND ConnectionId <> :connectionId",
        ExpressionAttributeValues: {
            ":bingoExecutionName": { S: bingoExecutionName },
            ":connectionId": { S: "disconnected" }
        }
    });
}

function buildUpdateBingoTicketCommand(executionName, playerId, connectionId) {
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

exports.buildScanActiveConnectionsCommand = buildScanActiveConnectionsCommand;
exports.buildUpdateBingoTicketCommand = buildUpdateBingoTicketCommand;