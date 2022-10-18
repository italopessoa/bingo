const TwitterService = require('../Services/TwitterHelperService');

const isPlayerRegistered = (players, playerId) => players.find(id => id === playerId);

/**
 *
 * State doc: 
 * @param {Object} state - state object
 *
 * Return doc: 
 * @returns {Object} state - updated state object
 * 
 */
exports.handler = async (state) => {
    const { bingoSubscriptionMessageId, players } = state;

    const newPlayers = (await TwitterService.getPlayerSubscriptionRetweetsFor(bingoSubscriptionMessageId))
        .ids
        .filter(playerId => !isPlayerRegistered(players, playerId));

    await TwitterService.checkUserIsFollowing(1);
    return {
        ...state,
        players: players.concat(newPlayers),
        newPlayers
    }
};
