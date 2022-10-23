const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');

async function sendErrorMessage(message) {
    var body = {
        messageType: MessageTypes.ERROR_MESSAGE,
        message
    };

    let messageFactory = twitterMessageFactory(body);
    let message = await messageFactory.create();
    let response = await messageFactory.send(message);
    return response.id_str;
}

exports.handler = async (state) => {

    let messageId = await sendErrorMessage("Paro paro paro, deu ruim aqui pessoal. Acontece, erros acontecem. Voltamos em breve co mais informacoes #obingonaopodeparar");

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, messageId]
    }
}