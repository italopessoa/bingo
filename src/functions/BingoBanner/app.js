const OauthService = require('../Services/OAuthHelperService');

const add_minutes = (dt, minutes) => new Date(dt.getTime() + minutes * 60000);

/**
 *
 * State doc: 
 * @param {Object} state - 
 *
 * Return doc: 
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.handler = async (state) => {
    var bingoStartTime = add_minutes(new Date(), 0);
    var bingoStartTimeEpoch = Math.round(bingoStartTime.getTime() / 1000);

    var response = await OauthService.oauthPost('https://api.twitter.com/1.1/statuses/update.json', {
        status: `teste ${bingoStartTime}`
    }, 'application/x-www-form-urlencoded');

    return {
        ...state,
        publishedMessages: [
            response.id_str
        ],
        bingo_advertise_tweet_id: response.id_str,
        ads_tweet: response.id_str,
        id: response.id,
        start_time: bingoStartTimeEpoch,
        start_time_z: bingoStartTime.toISOString()
    }
}