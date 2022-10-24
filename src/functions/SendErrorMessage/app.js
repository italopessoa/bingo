const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');

exports.handler = async (state) => {

    let messageId = await sendErrorMessage("Paro paro paro, deu ruim aqui pessoal. Acontece, erros acontecem. Voltamos em breve co mais informacoes #obingonaopodeparar");

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, messageId]
    }
}

async function sendErrorMessage(messageContent) {
    let messageFactory = twitterMessageFactory(MessageTypes.ERROR_MESSAGE, {
        message: messageContent
    });
    let response = await messageFactory.buildAndSend();
    return response.id_str;
}