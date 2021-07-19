const { oauthPost } = require('../oauth-utils');

var add_minutes = function (dt, minutes) {
    return new Date(dt.getTime() + minutes * 60000);
}

const publishBingoAdvertisiment = async (state) => {
    var v = add_minutes(new Date(), 0);
    var ts = Math.round(v.getTime() / 1000);

    var response = await oauthPost('https://api.twitter.com/1.1/statuses/update.json', {
        status: new Date().toISOString()
    }, 'application/x-www-form-urlencoded');

    return { ads_tweet: response.id_str, id: response.id, start_time: ts,start_time_z: v.toISOString() }
}

exports.publishBingoAdvertisiment = publishBingoAdvertisiment;