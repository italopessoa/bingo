const TwitterService = require('../Services/TwitterHelperService');

exports.handler = async ({ state }) => {
    console.log("DESTROY MESSAGE");
    for (let message of (state.publishedMessages ?? [])) {
        await TwitterService.destroyMessage(message);
        console.log("MESSAGE DESTROYED ", message);
    }
    return state;
}