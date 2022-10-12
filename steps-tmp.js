const crypto = require('crypto');
const { oauthPost, oauthGet } = require('./src/functions/oauth-utils');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();
//var table = process.env.AUDIENCE_TABLE;


let numbers = [...Array(75)].map((item, currentIndex) => {
    return { [currentIndex + 1]: false }
});

const updateListenerItem = async (card, cardhash, expressionAttributeValues) => {
    console.log(`[updateListenerItem] preparing update params for listener ${phoneNumber}`);
    var params = {
        TableName: table,
        Item: {
            hash: cardhash,
            userId: 1,
            card: "1-2-3-4-5-6-7"
        },
        ConditionExpression: 'attribute_not_exists(hash)',
        ReturnValues: 'ALL_NEW'
    };

    console.log('sending update request');
    var x = await dynamodb.putItem(params).promise();
}

const board = [
    {
        min: 1,
        max: 15,
        key: 'B',
        cardMax: 5
    },
    {
        min: 16,
        max: 30,
        key: 'I',
        cardMax: 5
    },
    {
        min: 31,
        max: 45,
        key: 'N',
        cardMax: 4
    },
    {
        min: 46,
        max: 60,
        key: 'G',
        cardMax: 5
    },
    {
        min: 61,
        max: 75,
        key: 'O',
        cardMax: 5
    }
];


var add_minutes = function (dt, minutes) {
    return new Date(dt.getTime() + minutes * 60000);
}

const postTweet = (body) => oauthPost('https://api.twitter.com/1.1/statuses/update.json', body, 'application/x-www-form-urlencoded');

const getRetweets = (id) => oauthGet(`https://api.twitter.com/1.1/statuses/retweeters/ids.json?id=${id}&count=100`);

const sendMessage = (recipient_id, message) => oauthPost(`https://api.twitter.com/1.1/direct_messages/events/new.json`,
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

const findUsersHandler = async ({ body: { ads_tweet, currentUsers, start_time, invalidUsers } }) => {
    var current = currentUsers ?? [];
    let newUsers = (await getRetweets(ads_tweet)).ids.filter(item => current.indexOf(item) < 0);
    return {
        currentUsers: current.concat(newUsers),
        newUsers,
        ads_tweet,
        start_time,
        invalidUsers
    };
};


const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const fillRandom = (size, min, max) => {
    let list = [];
    do {
        const number = getRandomNumber(min, max);
        if (!list.includes(number)) {
            list.push(number);
        }
    } while (list.length < size);
    return list;
}

const fillByOrder = (n, size, min, max) => {
    var columnNumbersRange = n
        .map(value => parseInt(Object.keys(value)[0]))
        .filter(x => {
            return x >= min && x <= max;
        });

    let cardColumn = [];
    for (let index = 0; index < size; index++) {
        columnNumbersRange.sort(() => 0.5 - Math.random());
        cardColumn.push(columnNumbersRange.pop());
    }

    return cardColumn;
}

const getCardNumbersByGroup = (n, size, min, max) =>
    (getRandomNumber(1, 9999999) % 2 == 0) ? fillByOrder(n, size, min, max) : fillRandom(size, min, max);


const generateCardNumbers = () => {

    var userCard = [];
    board.forEach((item => {
        var cardColumn = getCardNumbersByGroup(numbers, item.cardMax, item.min, item.max);
        userCard = userCard.concat(cardColumn);
    }));

    return userCard;
}

const generateCard = async (userId,username) => {

    let userCard = generateCardNumbers();
    let cardCreated = false;
    do {
        try {
            var cardCopy = userCard;
            const hash = crypto.createHash('sha256');
            hash.update(cardCopy.sort((a, b) => a - b).join('-'));
            var hashBase64 = hash.digest('base64');
            var params = {
                TableName: "bingo_cards2",
                Item: {
                    cardHash: hashBase64,
                    userId: "" + userId + "",
                    card: userCard.join('-'),
                    userName:username
                },
                ConditionExpression: 'attribute_not_exists(cardHash)',
                ReturnValues: "ALL_OLD",
                ReturnItemCollectionMetrics: "SIZE"
            };

            var x = await dynamodb.put(params).promise();
            cardCreated = true;
        } catch (e) {
            if (e.code == 'ConditionalCheckFailedException') {
                cardCreated = false;
                userCard = generateCardNumbers();
            }
        }
    }
    while (!cardCreated);
    return userCard;
}
const checkUserIsValid = async (userId) => {
    try {

        var response = await oauthGet(`https://api.twitter.com/2/users/${userId}`);
        return response.data.username;
    } catch (error) {
        return null;
    }
}

const createCardsHandler = async ({ body: { currentUsers, newUsers, ads_tweet, start_time, invalidUsers } }) => {
    for (var prop in newUsers.filter(x => (invalidUsers ?? []).indexOf(x) < 0)) {
        const userId = newUsers[prop]
        let invalidUsers = [];
        try {
            var username = await checkUserIsValid(userId);
            if (username) {
                var card = await generateCard(userId, username);
                await sendMessage(userId, "sua cartela = " + card.join('-'));
            } else {
                invalidUsers.push(userId);
            }
        }
        catch (e) {
            invalidUsers.push(userId);
        }
        return {
            currentUsers: currentUsers.filter(x => invalidUsers.indexOf(x) < 0),
            invalidUsers,
            ads_tweet,
            ads_tweet,
            start_time,
            current_time: Math.round(new Date().getTime() / 1000)
        }
    };
}

const publishBingoAdvertisiment = async (event) => {
    var v = add_minutes(new Date(), 2);
    var ts = Math.round(v.getTime() / 1000);

    var response = await postTweet({
        status: ts + " Se ler isso da um retuite ai, to fazendo uns teste valeu #dev #javascript java e lento #bitcoin! " + v.getHours() + ":" + v.getMinutes()
    });

    return { ads_tweet: response.id_str, id: response.id, start_time: ts }
}

exports.publishBingoAdvertisiment = publishBingoAdvertisiment;
exports.createCardsHandler = createCardsHandler;
exports.findUsersHandler = findUsersHandler;