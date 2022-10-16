const TwitterService = require('../Services/TwitterHelperService');

/**
 *
 * State doc: 
 * @param {Object} state - 
 *
 * Return doc: 
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.handler = async ({ state }) => {
    const { ads_tweet, currentUsers } = state;

    var users = currentUsers ?? [];
    const newUsers = (await TwitterService.getRetweetsFor(ads_tweet))
        .ids
        .filter(item => users.indexOf(item) < 0);

    return {
        ...state,
        currentUsers: users.concat(newUsers),
        newUsers
    }
};
