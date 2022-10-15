var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

const getUserCard = async (user_id, message_id_str) => {
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
        userTicket = { userName: result.Items[0].userName, userCard, message_id_str };
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

exports.getUserCard = getUserCard;
exports.getBingoNumbers = getBingoNumbers;