const OauthService = require('../../Services/TwitterHelperService');

const add_minutes = (dt, minutes) => new Date(dt.getTime() + minutes * 60000);

const publishBingoPosterHandler = async (state) => {
    var bingoStartTime = add_minutes(new Date(), 0);
    var bingoStartTimeEpoch = Math.round(bingoStartTime.getTime() / 1000);

    var response = await OauthService.postStatusUpdate({ status: `teste ${bingoStartTime}` });

    return {
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

exports.publishBingoPosterHandler = publishBingoPosterHandler;