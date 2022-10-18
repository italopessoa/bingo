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

const TWITTER_API_V1_1 = 'https://api.twitter.com/1.1';
const TWITTER_API_V2 = 'https://api.twitter.com/2';

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
    let result = {
        isValid: false,
        userName: null
    }

    try {

        var response = await oauthGet(`${TWITTER_API_V2}/users/${userId}`);
        result.isValid = true;
        result.userName = response.data.username;

        return result;
    } catch (error) {
        return result;
    }

}

const getUserName = async (userId) => {
    try {
        var response = await oauthGet(`${TWITTER_API_V2}/users/${userId}`);
        result.userName = response.data.username;

        return response.data.username;
    } catch (error) {
        console.log(`Error when trying to get username for userId ${userId}: `, error);
        return null;
    }
}

const getPlayerSubscriptionRetweetsFor = async (id) => {
    console.log("Trying to get retweets for Bingo advertisement message.");
    const result = await oauthGet(`${TWITTER_API_V1_1}/statuses/retweeters/ids.json?id=${id}&count=100`);
    console.log(`${result.ids.length} messages found`);

    return result;
}

const getTargetUserRelationship = async (userTargetId) => {
    console.log("Checking relationship between accounts");
    const result = await oauthGet(`${TWITTER_API_V1_1}/friendships/show.json?source_screen_name=ItaloNeyPessoa&target_id=${userTargetId}`);
    console.log(result);

    return result.relationship.target;
}
const postStatusUpdate = (message) => oauthPost(`${TWITTER_API_V1_1}/statuses/update.json`, {
    ...message
}, 'application/x-www-form-urlencoded');

const destroyMessage = (message) => oauthPost(`${TWITTER_API_V1_1}/statuses/destroy/${message}.json`);


const createImageMedia = (imageBase64Text) => oauthPost('https://upload.twitter.com/1.1/media/upload.json', {
    media_data: imageBase64Text,
    media_category: "tweet_image"
}, 'multipart/form-data');


const searchWinners = async () => {
    console.log("Trying to get players who claim victory on Twitter.");
    const result = await oauthGet(`${TWITTER_API_V1_1}/search/tweets.json?q=%23bingobati&result_type=recent`);
    console.log("These users were found: ", JSON.stringify(result.statuses));

    return result;
}

const sendDirectMessageWithTicket = (recipient_id, message) => oauthPost(`${TWITTER_API_V1_1}/direct_messages/events/new.json`,
    JSON.stringify({
        event: {
            type: "message_create",
            message_create: {
                target: {
                    recipient_id: `${recipient_id}`
                },
                message_data: {
                    text: message,
                    ctas: [
                        {
                            "type": "web_url",
                            "label": "So noticia top",
                            "url": "http://www.diariodequixada.com.br/"
                        },
                        {
                            "type": "web_url",
                            "label": "Site de putaria",
                            "url": "https://www.youtube.com/watch?v=8R-SVel6NVAt"
                        }
                    ]
                },
            }
        }
    }),
    'application/json');

exports.oauthGet = oauthGet;
exports.oauthPost = oauthPost;
exports.validatePlayer = validatePlayer;
exports.getPlayerSubscriptionRetweetsFor = getPlayerSubscriptionRetweetsFor;
exports.postStatusUpdate = postStatusUpdate;
exports.destroyMessage = destroyMessage;
exports.createImageMedia = createImageMedia;
exports.searchWinners = searchWinners;
exports.sendDirectMessageWithTicket = sendDirectMessageWithTicket;
exports.getTargetUserRelationship = getTargetUserRelationship;
exports.getUserName = getUserName;