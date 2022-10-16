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
exports.handler = async (input) => {
    const { StartTime, ExecutionName: executionName } = input;
    var bingoStartTime = add_minutes(new Date(StartTime), 0);
    var bingoStartTimeEpoch = Math.round(bingoStartTime.getTime() / 1000);

    var response = await TwitterService.postStatusUpdate({
        status: `Play at: ${StartTime} - Start at:${add_minutes(new Date(StartTime), 10)}`
    });

    return {
        executionName,
        publishedMessages: [
            response.id_str
        ],
        ads_tweet: response.id_str,
        start_time: bingoStartTimeEpoch,
        start_time_z: bingoStartTime.toISOString()
    }
}