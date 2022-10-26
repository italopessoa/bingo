const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');
const { getBingoNumbers } = require('../assets');

/**
 *
 * Input doc: 
 * @param {Object} input - initial input containing Execution time and name 
 *
 * Return doc: 
 * @returns {Object} state - Return initial state
 * 
 * https://www.npmjs.com/package/middy
 */
exports.handler = async (input) => {
    const { StartTime, ExecutionName: executionName } = input;

    let response = await twitterMessageFactory(MessageTypes.STATUS_MESSAGE, {
        message: `Play at: ${StartTime} - Start at:${add_minutes(new Date(StartTime), 10)}`
    }).buildAndSend();

    //TODO: better solution https://javascript.info/array-methods#shuffle-an-array
    const numbers = getBingoNumbers()
        .sort(() => 0.5 - Math.random());

    return {
        executionName,
        publishedMessages: [
            response.id_str
        ],
        bingoSubscriptionMessageId: response.id_str,
        bingoStartTimeISO: add_minutes(new Date(StartTime), 0).toISOString(),
        players: [],
        invalidPlayers: [],
        calledNumbers: [],
        numbers,
        numbersCount: numbers.length - 1
    }
}

const add_minutes = (dt, minutes) => new Date(dt.getTime() + minutes * 60000);