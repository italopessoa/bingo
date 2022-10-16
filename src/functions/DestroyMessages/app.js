import { destroyMessage } from '../Services/TwitterHelperService';

export async function handler(state) {
    for (let message of (state.publishedMessages ?? [])) {
        await destroyMessage(message);
    }
    return state;
}