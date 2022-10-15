const OauthService = require('../oauth-utils');

const getRetweets = (id) => OauthService.oauthGet(`https://api.twitter.com/1.1/statuses/retweeters/ids.json?id=${id}&count=100`);

/**
 *
 * State doc: 
 * @param {Object} state - 
 *
 * Return doc: 
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.handler = async (state) => {
    const { ads_tweet, currentUsers } = state;

    var users = currentUsers ?? [];
    const newUsers = (await getRetweets(ads_tweet))
        .ids
        .filter(item => users.indexOf(item) < 0);

    return {
        body: {
            state: {
                ...state,
                currentUsers: users.concat(newUsers),
                newUsers
            }
        },
        statusCode: 200
    };
};
