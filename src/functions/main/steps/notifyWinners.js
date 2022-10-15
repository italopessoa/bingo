const OauthService = require('../../Services/OAuthHelperService');

const notifyWinnersHandler = async (state) => {
    let messages = []
    for (let item of (state.winnersList ?? [])) {
        var body = {
            status: "parabens jovem voce ganhou " + new Date().toISOString(),
            in_reply_to_status_id: item.message_id_str
        };
        console.log(body);
        var response = await OauthService.oauthPost('https://api.twitter.com/1.1/statuses/update.json', body, 'application/x-www-form-urlencoded');
        messages.push(response.id_str);
    }

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, ...messages]
    }
}

exports.notifyWinnersHandler = notifyWinnersHandler;