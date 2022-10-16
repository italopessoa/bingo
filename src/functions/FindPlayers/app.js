const TwitterService = require('../Services/TwitterHelperService');

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
    const { bingoSubscriptionMessageId, currentPlayers } = state;

    var players = currentPlayers ?? [];
    const newPlayers = (await TwitterService.getRetweetsFor(bingoSubscriptionMessageId))
        .ids
        .filter(item => players.indexOf(item) < 0);

    return {
        ...state,
        currentPlayers: players.concat(newPlayers),
        newPlayers
    }
};
