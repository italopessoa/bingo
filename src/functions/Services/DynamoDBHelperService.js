var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

const getUserCard = async (playerId, winnerNotificationReferenceMessageId) => {
    var params = {
        ExpressionAttributeValues: {
            ":playerId": playerId
        },
        FilterExpression: "playerId = :playerId",
        TableName: "BingoTicket"
    };

    var result = await dynamodb.scan(params).promise();

    let userTicket = null;
    if (result.Count > 0) {
        var userCard = result.Items[0].card;
        userTicket = { userName: result.Items[0].userName, userCard, winnerNotificationReferenceMessageId };
    }
    return userTicket;
}

const tryToSaveBingoTicket = async (ticketHash, playerId, numbers, userName, bingoExecutionName) => {

    try {
        var params = {
            TableName: "BingoTicket",
            Item: {
                TicketHash: ticketHash,
                playerId: playerId,
                card: numbers,
                userName,
                bingoExecutionName
            },
            ConditionExpression: 'attribute_not_exists(TicketHash) AND attribute_not_exists(playerId) AND attribute_not_exists(bingoExecutionName)',
            ReturnValues: "ALL_OLD",
            ReturnItemCollectionMetrics: "SIZE"
        };

        await dynamodb.put(params).promise();
    } catch (e) {
        console.log("Error when trying to save bingo ticket: ", JSON.stringify(e));
        return false;
    }
    return true;
}

exports.getUserCard = getUserCard;
exports.tryToSaveBingoTicket = tryToSaveBingoTicket;