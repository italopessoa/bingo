const OauthService = require('../Services/OAuthHelperService');

exports.handler = async ({ state }) => {
    console.log("DESTROY MESSAGE");
    for (let message of (state.publishedMessages ?? [])) {
        await OauthService.oauthPost(`https://api.twitter.com/1.1/statuses/destroy/${message}.json`);
        console.log("MESSAGE DESTROYED ", message);
    }
    return state;
}