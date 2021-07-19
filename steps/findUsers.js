const { oauthGet } = require('../oauth-utils');

const getRetweets = (id) => oauthGet(`https://api.twitter.com/1.1/statuses/retweeters/ids.json?id=${id}&count=100`);

const findUsersHandler = async (state) => {
    const { ads_tweet, currentUsers } = state;
    var current = currentUsers ?? [];
    let newUsers = (await getRetweets(ads_tweet)).ids.filter(item => current.indexOf(item) < 0);
    return {
        ..state,
        currentUsers: current.concat(newUsers),
        newUsers
    };
};

exports.findUsersHandler = findUsersHandler;
