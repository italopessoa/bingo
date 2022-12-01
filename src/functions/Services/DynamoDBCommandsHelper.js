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

function buildUpdateBingoTicketCommand(executionName, { playerId, playerName }, connectionId) {
    return new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            BingoExecutionName: { S: executionName },
            PlayerId: { S: playerId },
            UserName: { S: playerName }
        },
        UpdateExpression: "SET ConnectionId = :connectionId, UserName = :userName",
        ExpressionAttributeValues: {
            ":connectionId": { S: connectionId },
            ":userName": { S: playerName ?? `player-${playerId}` }
        }
    });
}

exports.buildScanActiveConnectionsCommand = buildScanActiveConnectionsCommand;
exports.buildUpdateBingoTicketCommand = buildUpdateBingoTicketCommand;