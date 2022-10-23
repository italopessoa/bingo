const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');

async function sendMessageToWinner(player) {
    var body = {
        messageType: MessageTypes.STATUS_RESPONSE_MESSAGE,
        message: "parabens jovem voce ganhou " + new Date().toISOString(),
        inResponseToMessageId: player.winnerNotificationReferenceMessageId
    };

    let messageFactory = twitterMessageFactory(body);
    let message = await messageFactory.create();
    let response = await messageFactory.send(message);
    return response.id_str;
}

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

