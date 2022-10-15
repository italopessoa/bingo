const OauthService = require('../Services/OAuthHelperService');

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
exports.handler = async ({ state }) => {
    const { ads_tweet, currentUsers } = state;

    var users = currentUsers ?? ["240045678"];
    const newUsers = (await getRetweets(ads_tweet))
        .ids
        .filter(item => users.indexOf(item) < 0);

    return {
        ...state,
        currentUsers: users.concat(newUsers),
        newUsers
    }
};
