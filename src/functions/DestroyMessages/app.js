const TwitterService = require('../Services/TwitterHelperService');

exports.handler = async (state) => {
    for (let message of (state.publishedMessages ?? [])) {
        await TwitterService.destroyMessage(message);
    }
    return state;
}