const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');

exports.handler = async (state) => {
    let messages = [];
    for (let player of (state.winnersList ?? [])) {
        messages.push(await sendMessageToWinner(player));
    }

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, ...messages]
    }
}

//TODO review if this function still needed when web app is complete
async function sendMessageToWinner(player) {
    var body = {
        message: "parabens jovem voce ganhou " + new Date().toISOString(),
        inResponseToMessageId: player.winnerNotificationReferenceMessageId
    };

    let messageFactory = twitterMessageFactory(MessageTypes.STATUS_RESPONSE_MESSAGE, body);
    let response = await messageFactory.buildAndSend();
    return response.id_str;
}