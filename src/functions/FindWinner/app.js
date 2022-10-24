const TwitterService = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');

exports.handler = async (state) => {
    let allPlayers = await getWinnerPlayersFromMessages(state);
    var allWinnersTickets = await getAllWinnersTickets(state.executionName, allPlayers);
    let winnersList = validateWinners(state.calledNumbers, allWinnersTickets);

    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
};

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

async function getAllWinnersTickets(executionName, allPlayers) {
    return await Promise.all(
        allPlayers
            .map(({ user_id_str, winnerNotificationReferenceMessageId }) => {
                return DynamoDBService.getUserTicket(user_id_str, executionName, winnerNotificationReferenceMessageId);
            }));
}

const validateWinners = (calledNumbers, playersTickets) => {
    console.log("Trying to validate winners");
    console.log("Players tickets: ", playersTickets);
    var winners = playersTickets
        .filter(ticket => ticket.numbers.every(ticketNumber => calledNumbers.includes(ticketNumber)))
    return winners;
}