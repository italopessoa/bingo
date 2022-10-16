import { postStatusUpdate } from '../Services/TwitterHelperService';

export async function handler(state) {
    let messages = []
    for (let player of (state.winnersList ?? [])) {
        var body = {
            status: "parabens jovem voce ganhou " + new Date().toISOString(),
            in_reply_to_status_id: player.winnerNotificationReferenceMessageId
        };

        var response = await postStatusUpdate(body);
        messages.push(response.id_str);
    }

    return {
        ...state,
        publishedMessages: [...state.publishedMessages, ...messages]
    }
}