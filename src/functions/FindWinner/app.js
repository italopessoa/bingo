import { searchWinners } from '../Services/TwitterHelperService';
import { getUserCard } from '../Services/DynamoDBHelperService';

const validateWinners = (calledNumbers, userCards) => {
    var winners = userCards
        .filter(item => item.userCard.filter(ticketNumber => calledNumbers.includes(ticketNumber)).length > 0)
        .map(item => item);
    return winners;
}

export async function handler(state) {
    const { currentPlayers, lastBallCalledDate } = state;
    var players = currentPlayers ?? [];
    let winners = await searchWinners();

    let allPlayers = winners.statuses
        .map(({ id_str, user, created_at, text }, _) => ({
            winnerNotificationReferenceMessageId: id_str,
            created_at,
            screen_name: user.screen_name,
            user_id: user.id_str,
            text
        }))
        .filter(({ user_id, created_at }) => players.indexOf(user_id) >= 0 && new Date(created_at) >= new Date(lastBallCalledDate));

    allPlayers.sort((a, b) => a.created_at <= b.created_at);

    console.log("buscar cartelas");

    var allUserCard =
        await Promise.all(
            allPlayers
                .map(({ user_id, winnerNotificationReferenceMessageId }) => {
                    return getUserCard(user_id, winnerNotificationReferenceMessageId);
                }));

    var winnersList = validateWinners(state.calledNumbers, allUserCard);

    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
}