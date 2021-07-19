const { oauthPost } = require('../oauth-utils');

const destroyMessagesHandler = async (state) => {
    console.log("DESTROY MESSAGE");
    console.log(`https://api.twitter.com/1.1/statuses/destroy/${state.ads_tweet}.json`)
    await oauthPost(`https://api.twitter.com/1.1/statuses/destroy/${state.ads_tweet}.json`)
    console.log("MESSAGE DESTROYED");
    return state;
}

exports.destroyMessagesHandler = destroyMessagesHandler;