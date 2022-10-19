const TwitterService = require('../Services/TwitterHelperService');


exports.handler = async (state) => {

    var response = await TwitterService.postStatusUpdate({
        status: "Paro paro paro, deu ruim aqui pessoal. Acontece, erros acontecem. Voltamos em breve co mais informacoes #obingonaopodeparar"
    });

    return {
        ...state,
        publishedMessages: [
            response.id_str
        ]
    }
}