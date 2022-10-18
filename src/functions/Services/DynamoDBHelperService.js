var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

const getUserCard = async (user_id, winnerNotificationReferenceMessageId) => {
    var params = {
        ExpressionAttributeValues: {
            ":userId": user_id
        },
        FilterExpression: "userId = :userId",
        TableName: "BingoTicket"
    };

    var result = await dynamodb.scan(params).promise();

    let userTicket = null;
    if (result.Count > 0) {
        var userCard = result.Items[0].card.split('-').map(n => parseInt(n));
        userTicket = { userName: result.Items[0].userName, userCard, winnerNotificationReferenceMessageId };
    }
    return userTicket;
}

const getBingoNumbers = async () => {
    var response = await dynamodb.query({
        TableName: "BingoRaffle",
        KeyConditionExpression: "raffle = :date",
        ExpressionAttributeValues: {
            ":date": new Date().toLocaleDateString('pt-BR'),
        },
        ScanIndexForward: false,
        Limit: 1
    }).promise();

    let numbers = [];

    if (response.Count == 0) {
        numbers = [...Array(25)]
            .map((item, currentIndex) => currentIndex + 1)
            .sort(() => 0.5 - Math.random());
    } else {
        numbers = response.Items[0].numbers;
    }
    return numbers;
}

const updateNumbers = async (numbers, selectedNumber, bingoExecutionName) => {

    var params = {
        TableName: "BingoRaffle",
        Item: {
            raffle: new Date().toLocaleDateString('pt-BR'),
            date: new Date().toISOString(),
            numbers: numbers.filter(i => i != selectedNumber),
            selectedNumber: selectedNumber,
            bingoExecutionName
        },
        ReturnValues: "ALL_OLD",
        ReturnItemCollectionMetrics: "SIZE"
    };

    await dynamodb.put(params).promise();
}

const tryToSaveBingoTicket = async (ticketHash, playerId, numbers, userName, bingoExecutionName) => {

    try {
        var params = {
            TableName: "BingoTicket",
            Item: {
                TicketHash: ticketHash,
                playerId: "" + playerId + "",
                card: numbers.join('-'),
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
exports.getBingoNumbers = getBingoNumbers;
exports.updateNumbers = updateNumbers;
exports.tryToSaveBingoTicket = tryToSaveBingoTicket;