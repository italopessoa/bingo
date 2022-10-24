var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();
//TODO check later https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/querycommand.html
const getUserTicket = async (playerId, bingoExecutionName, winnerNotificationReferenceMessageId) => {
    try {
        console.log(`Trying to get Bingo_(${bingoExecutionName}) ticket for Player: ${playerId}`);
        
        var params = {
            ExpressionAttributeValues: {
                ":bingoExecutionName": bingoExecutionName,
                ":playerId": playerId
            },
            KilterExpression: "BingoExecutionName = :bingoExecutionName AND PlayerId = :playerId",
            TableName: "BingoTicket"
        };

        var result = await dynamodb.query(params).promise();

        let userTicket = null;
        if (result.Count > 0) {
            var numbers = result.Items[0].Ticket;
            userTicket = { userName: result.Items[0].UserName, numbers, winnerNotificationReferenceMessageId };
        }
        return userTicket;

    } catch (error) {
        console.error(`Error when trying to get Bingo_(${bingoExecutionName}) ticket for Player: ${playerId}: `, JSON.stringify(error));
        throw error;
    }
}

const tryToSaveBingoTicket = async (ticketHash, playerId, numbers, userName, bingoExecutionName) => {
    try {
        console.log(`Trying to save ticket ${numbers} for Player: ${playerId} on Bingo_(${bingoExecutionName})`);
        
        var params = {
            TableName: "BingoTicket",
            Item: {
                BingoExecutionName: bingoExecutionName,
                TicketHash: ticketHash,
                PlayerId: playerId,
                Ticket: numbers,
                UserName: userName,
            },
            ReturnValues: "ALL_OLD",
            ReturnItemCollectionMetrics: "SIZE"
        };

        await dynamodb.put(params).promise();
    } catch (error) {
        console.error(`Error when rying to save ticket ${numbers} for Player: ${playerId} on Bingo_(${bingoExecutionName}): `, JSON.stringify(error));
        return false;
    }
    return true;
}

exports.getUserTicket = getUserTicket;
exports.tryToSaveBingoTicket = tryToSaveBingoTicket;