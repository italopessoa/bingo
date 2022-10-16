const TwitterService = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');

const searchWinners = () =>
    TwitterService.oauthGet(`https://api.twitter.com/1.1/search/tweets.json?q=%23bingobati&result_type=recent`);

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

    var allUserCard = await Promise.all(allUsers.map(({ user_id, id_str }) => DynamoDBService.getUserCard(user_id, id_str)));
    var winnersList = validateWinners(state.calledNumbers, allUserCard);

    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
};