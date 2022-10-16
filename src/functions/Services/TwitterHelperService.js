const OAuth = require('oauth');

let oauth_consumer_key = process.env.CONSUMER_KEY;
let oauth_consumer_secret = process.env.CONSUMER_SECRET;
let oauth_token = process.env.TOKEN;
let oauth_token_secret = process.env.SECRET;

const getOAuth = () => new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    oauth_consumer_key,
    oauth_consumer_secret,
    '1.0A', null, 'HMAC-SHA1'
);

const oauthPost = (url, body = null, contentType = "application/json") => new Promise((resolve, reject) => {
    getOAuth().post(url,
        oauth_token,
        oauth_token_secret,
        body,
        contentType,
        (error, data, result) => {
            if (error) {
                console.log("[oauthPost]", error);
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (parseError) {
                console.log("[oauthPost] parseError", parseError);
                reject(parseError);
            }
        });
});

const oauthGet = (url) => new Promise((resolve, reject) => {
    getOAuth().get(url,
        oauth_token,
        oauth_token_secret,
        (error, twitterResponseData, result) => {

            if (error) {
                console.log("[oauthGet]", error)
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(twitterResponseData));
            } catch (parseError) {
                console.log("[oauthGet] parseError", parseError);
                reject(parseError);
            }
        });
});

const validatePlayer = async (userId) => {
    try {
        var response = await oauthGet(`https://api.twitter.com/2/users/${userId}`);
        return response.data.username;
    } catch (error) {
        return null;
    }
}


const getRetweetsFor = (id) => oauthGet(`https://api.twitter.com/1.1/statuses/retweeters/ids.json?id=${id}&count=100`);

const postStatusUpdate = (message) => oauthPost('https://api.twitter.com/1.1/statuses/update.json', {
    ...message
}, 'application/x-www-form-urlencoded');

const destroyMessage = (message) => oauthPost(`https://api.twitter.com/1.1/statuses/destroy/${message}.json`);

exports.oauthGet = oauthGet;
exports.oauthPost = oauthPost;
exports.validatePlayer = validatePlayer;
exports.getRetweetsFor = getRetweetsFor;
exports.postStatusUpdate = postStatusUpdate;
exports.destroyMessage = destroyMessage;