const { oauthPost } = require('../../Services/TwitterHelperService');

const destroyMessagesHandler = async (state) => {
    console.log("DESTROY MESSAGE");
    for (let message of (state.publishedMessages ?? [])) {
        await oauthPost(`https://api.twitter.com/1.1/statuses/destroy/${message}.json`);
        console.log("MESSAGE DESTROYED ", message);
    }
    return state;
}

exports.destroyMessagesHandler = destroyMessagesHandler;