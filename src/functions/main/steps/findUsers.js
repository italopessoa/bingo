const OauthService = require('../../oauth-utils');

const getRetweets = (id) => OauthService.oauthGet(`https://api.twitter.com/1.1/statuses/retweeters/ids.json?id=${id}&count=100`);

const findUsersHandler = async (state) => {
    const { ads_tweet, currentUsers } = state;

    var users = currentUsers ?? [];
    const newUsers = (await getRetweets(ads_tweet))
        .ids
        .filter(item => users.indexOf(item) < 0);
    return {
        ...state,
        currentUsers: users.concat(newUsers),
        newUsers
    };
};

exports.findUsersHandler = findUsersHandler;
