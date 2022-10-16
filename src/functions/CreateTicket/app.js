const crypto = require('crypto');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();
const { oauthPost, validatePlayer } = require('../Services/TwitterHelperService');
const { board } = require('../assets')
;

let numbers = [...Array(75)].map((item, currentIndex) => {
    return { [currentIndex + 1]: false }
});

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

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

const generateCard = async (playerId, username) => {

    let userCard = generateCardNumbers();
    let cardCreated = false;
    do {
        try {
            var cardCopy = [...userCard];
            const hash = crypto.createHash('sha256');
            hash.update(cardCopy.sort((a, b) => a - b).join('-'));
            var hashBase64 = hash.digest('base64');
            var params = {
                TableName: "BingoTicket",
                Item: {
                    TicketHash: hashBase64,
                    playerId: "" + playerId + "",
                    card: userCard.join('-'),
                    userName: username
                },
                ConditionExpression: 'attribute_not_exists(TicketHash) AND attribute_not_exists(playerId)',
                ReturnValues: "ALL_OLD",
                ReturnItemCollectionMetrics: "SIZE"
            };

            await dynamodb.put(params).promise();
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

exports.handler = async (state) => {
    const { currentPlayers, newPlayers, invalidPlayers } = state;
    let tmpInvalidPlayers = invalidPlayers ?? [];
    for (var prop in newPlayers.filter(x => tmpInvalidPlayers.indexOf(x) < 0)) {
        const playerId = newPlayers[prop]
        try {
            var username = await validatePlayer(playerId);
            if (username) {
                var card = await generateCard(playerId, username);
                await sendMessage(playerId, "sua cartela = " + card.join('-'));
            } else {
                tmpInvalidPlayers.push(playerId);
            }
        }
        catch (e) {
            tmpInvalidPlayers.push(playerId);
        }
    };
    return {
        ...state,
        currentPlayers: currentPlayers.filter(x => tmpInvalidPlayers.indexOf(x) < 0),
        invalidPlayers: tmpInvalidPlayers,
        currentTimeISO: new Date().toISOString(),
    }
}