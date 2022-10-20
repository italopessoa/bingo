const TwitterService = require('../Services/TwitterHelperService');

const add_minutes = (dt, minutes) => new Date(dt.getTime() + minutes * 60000);

/**
 *
 * Input doc: 
 * @param {Object} input - initial input containing Execution time and name 
 *
 * Return doc: 
 * @returns {Object} state - Return initial state
 * 
 */

const getAvailableNumbers = () => [...Array(25)]
    .map((item, currentIndex) => currentIndex + 1)
    .sort(() => 0.5 - Math.random());

exports.handler = async (input) => {
    const { StartTime, ExecutionName: executionName } = input;

    var response = await TwitterService.postStatusUpdate({
        status: `Play at: ${StartTime} - Start at:${add_minutes(new Date(StartTime), 10)}`
    });
    const numbers = getAvailableNumbers();

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