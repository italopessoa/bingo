const OAuth = require('oauth');

const oauth_consumer_key = process.env.CONSUMER_KEY;
const oauth_consumer_secret = process.env.CONSUMER_SECRET;
const oauth_token = process.env.TOKEN;
const oauth_token_secret = process.env.SECRET;

const TWITTER_API_V1_1 = 'https://api.twitter.com/1.1';
const TWITTER_API_V2 = 'https://api.twitter.com/2';

const MessageTypes = {
    ERROR_MESSAGE: 'ERROR_MESSAGE',
    STATUS_MESSAGE: 'STATUS_MESSAGE',
    STATUS_RESPONSE_MESSAGE: 'STATUS_RESPONSE_MESSAGE',
    STATUS_MESSAGE_WITH_IMAGE_MEDIA: 'STATUS_MESSAGE_WITH_IMAGE_MEDIA',
    DIRECT_MESSAGE: 'DIRECT_MESSAGE'
};

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

        return response.data.username;
    } catch (error) {
        console.log(`Error when trying to get username for userId ${userId}: `, error);
        return null;
    }
}

const getPlayerSubscriptionRetweetsFor = async (id) => {
    console.log("Trying to get retweets for Bingo advertisement message.");
    const result = await oauthGet(`${TWITTER_API_V1_1}/statuses/retweeters/ids.json?id=${id}&count=100&stringify_ids=true`);
    console.log(`${result.ids.length} messages found`);

    return result;
}

const getTargetUserRelationship = async (userTargetId) => {
    console.log("Checking relationship between accounts");
    const result = await oauthGet(`${TWITTER_API_V1_1}/friendships/show.json?source_screen_name=ItaloNeyPessoa&target_id=${userTargetId}`);
    console.log(result);

    return result.relationship.target;
}

const createStatusMessage = (body) => {
    return { status: body.message };
};

const createStatusResponseMessage = (body) => {
    return { status: body.message, in_reply_to_status_id: body.inResponseToMessageId };
};

const createErrorMessage = (body) => {
    return { status: body.message };
};

const createDirectMessage = (body) => {
    return {
        event: {
            type: "message_create",
            message_create: {
                target: {
                    recipient_id: `${body.recipientId}`
                },
                message_data: {
                    text: body.message
                }
            }
        }
    }
};

const createMediaIds = async (mediaImagesBase64) => {
    let media_ids = [];
    for (var i = 0; i < mediaImagesBase64.length; i++) {
        media_ids.push((await createImageMedia(mediaImagesBase64[i])).media_id_string);
    }
    return media_ids;
}

const createMessageWithImageMedia = async (body) => {
    let media_ids = await createMediaIds(body.mediaImagesBase64);
    return { status: body.message, media_ids: media_ids.join(',') };
};

const sendStatusMessage = (message) => oauthPost(`${TWITTER_API_V1_1}/statuses/update.json`, {
    ...message
}, 'application/x-www-form-urlencoded');

const sendDirectMessage = (message) => {
    console.log('[sendDirectMessage], ', message);
    return oauthPost(`${TWITTER_API_V1_1}/direct_messages/events/new.json`,
        JSON.stringify({
            ...message
        }),
        'application/json');
};

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

const createMessageFunctions = {
    [MessageTypes.ERROR_MESSAGE]: createErrorMessage,
    [MessageTypes.STATUS_MESSAGE]: createStatusMessage,
    [MessageTypes.STATUS_RESPONSE_MESSAGE]: createStatusResponseMessage,
    [MessageTypes.STATUS_MESSAGE_WITH_IMAGE_MEDIA]: createMessageWithImageMedia,
    [MessageTypes.DIRECT_MESSAGE]: createDirectMessage
}

const sendMessageFunctions = {
    [MessageTypes.ERROR_MESSAGE]: sendStatusMessage,
    [MessageTypes.STATUS_MESSAGE]: sendStatusMessage,
    [MessageTypes.STATUS_RESPONSE_MESSAGE]: sendStatusMessage,
    [MessageTypes.STATUS_MESSAGE_WITH_IMAGE_MEDIA]: sendStatusMessage,
    [MessageTypes.DIRECT_MESSAGE]: sendDirectMessage
}

/** 
 * @param {{
 * messageType,
 * message,
 * mediaImagesBase64,
 * recipienteId}} body paramaters to create messages depending on messageType
 * 
 * @returns {{create:function, send: function(message)}} factory methods to create and send twitter message
 */
const twitterMessageFactory = (messageType, body) => {
    var functionToCreateMessage = createMessageFunctions[messageType];
    var functionToSendMessage = sendMessageFunctions[messageType];

    return {
        buildAndSend: () => functionToSendMessage(functionToCreateMessage(body))
    }
};

exports.getPlayerSubscriptionRetweetsFor = getPlayerSubscriptionRetweetsFor;
exports.destroyMessage = destroyMessage;
exports.searchWinners = searchWinners;
exports.getTargetUserRelationship = getTargetUserRelationship;
exports.getTwitterUserName = getUserName;
exports.twitterMessageFactory = twitterMessageFactory;
exports.MessageTypes = MessageTypes;