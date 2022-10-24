const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');

exports.handler = async (state) => {

    let messageId = await sendErrorMessage("Paro paro paro, deu ruim aqui pessoal. Acontece, erros acontecem. Voltamos em breve co mais informacoes #obingonaopodeparar");

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, messageId]
    }
}

async function sendErrorMessage(messageContent) {
    var body = {
        messageType: MessageTypes.ERROR_MESSAGE,
        message: messageContent
    };

    let messageFactory = twitterMessageFactory(body);
    let message = await messageFactory.create();
    let response = await messageFactory.send(message);
    return response.id_str;
}