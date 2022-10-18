const TwitterService = require('../Services/TwitterHelperService');

const isPlayerRegistered = (players, playerId) => players.find(id => id === playerId);

const isFollowerPlayer = async (playerId) => (await TwitterService.getTargetUserRelationship(playerId)).following;

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
    const { bingoSubscriptionMessageId, players, invalidPlayers } = state;

    const newPlayers = (await TwitterService.getPlayerSubscriptionRetweetsFor(bingoSubscriptionMessageId))
        .ids
        .filter(playerId => {
            return !isPlayerRegistered(players, playerId)
                && !invalidPlayers.find(id => id === playerId);
        });

    const followers = newPlayers.filter(async playerId => playerId == 240045678 || (await isFollowerPlayer(playerId)));
    const notFollowers = newPlayers.filter(playerId => !followers.find(id => id === playerId));

    return {
        ...state,
        players: players.concat(followers),
        newPlayers: followers,
        invalidPlayers: [...invalidPlayers, ...notFollowers]
    }
};
