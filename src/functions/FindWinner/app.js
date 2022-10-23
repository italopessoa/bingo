const TwitterService = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');

const validateWinners = (calledNumbers, userCards) => {
    console.log("Trying to validate winners");
    console.log("Players tickets: ", userCards);
    var winners = userCards
        .filter(item => item.userCard.every(ticketNumber => calledNumbers.includes(ticketNumber)))
    return winners;
}

async function getWinnerPlayersFromMessages({ lastBallCalledDate, players }) {
    let winners = await TwitterService.searchWinners();

    console.log("Filtering winners after last ball drawn: ", lastBallCalledDate);
    let allPlayers = winners.statuses
        .map(({ id_str, user, created_at, text }, _) => ({
            winnerNotificationReferenceMessageId: id_str,
            created_at,
            screen_name: user.screen_name,
            user_id_str: user.id_str,
            text
        }))
        .filter(({ user_id_str, created_at }) => players.indexOf(user_id_str) >= 0 && new Date(created_at) >= new Date(lastBallCalledDate));

    allPlayers.sort((a, b) => a.created_at <= b.created_at);

    console.log("Players found: ", allPlayers);
    return allPlayers;
}

async function getAllUserCards(allPlayers) {
    return await Promise.all(
        allPlayers
            .map(({ user_id_str, winnerNotificationReferenceMessageId }) => {
                return DynamoDBService.getUserCard(user_id_str, winnerNotificationReferenceMessageId);
            }));
}

exports.handler = async (state) => {
    let allPlayers = await getWinnerPlayersFromMessages(state);
    var allUserCard = await getAllUserCards(allPlayers);
    let winnersList = validateWinners(state.calledNumbers, allUserCard);

    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
};