var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

const OauthService = require('../Services/OAuthHelperService');

const searchWinners = () =>
    OauthService.oauthGet(`https://api.twitter.com/1.1/search/tweets.json?q=%23bingobati&result_type=recent`);

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

const validateWinners = (calledNumbers, userCards) => {
    var winners = userCards
        .filter(item => item.userCard.filter(ticketNumber => calledNumbers.includes(ticketNumber)).length > 0)
        .map(item => item);
    return winners;
}

exports.handler = async ({ state }) => {
    const { currentUsers, lastBallCallDate } = state;
    var users = currentUsers ?? [];
    let winners = await searchWinners();

    console.log("found winners ", console.log(winners.statuses));

    let allUsers = winners.statuses
        .map(({ id_str, user, created_at, text }, _) => ({
            id_str,
            created_at,
            screen_name: user.screen_name,
            user_id: user.id_str,
            text
        }))
        .filter(({ user_id, created_at }) => users.indexOf(user_id) >= 0 && new Date(created_at) >= new Date(lastBallCallDate));

    allUsers.sort((a, b) => a.created_at <= b.created_at);

    console.log("buscar cartelas");

    var allUserCard = await Promise.all(allUsers.map(({ user_id, id_str }) => getUserCard(user_id, id_str)));
    var winnersList = validateWinners(state.calledNumbers, allUserCard);

    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
};