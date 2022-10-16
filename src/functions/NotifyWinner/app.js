const TwitterService = require('../Services/TwitterHelperService');

exports.handler = async ({ state }) => {
    let messages = []
    for (let item of (state.winnersList ?? [])) {
        var body = {
            status: "parabens jovem voce ganhou " + new Date().toISOString(),
            in_reply_to_status_id: item.message_id_str
        };
        console.log(body);
        var response = await TwitterService.postStatusUpdate(body);
        messages.push(response.id_str);
    }

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, ...messages]
    }
}