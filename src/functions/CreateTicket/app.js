const crypto = require('crypto');
const TwitterService = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');
const { board, images } = require('../assets');

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

const generateCard = async (playerId, username, bingoExecutionName) => {

    let userCard = generateCardNumbers();
    let cardCreated = false;
    do {

        var cardCopy = [...userCard];
        const hash = crypto.createHash('sha256');
        hash.update(cardCopy.sort((a, b) => a - b).join('-'));
        var hashBase64 = hash.digest('base64');
        cardCreated = await DynamoDBService.tryToSaveBingoTicket(hashBase64, playerId, cardCopy, username, bingoExecutionName);
    }
    while (!cardCreated);
    return userCard;
}


exports.handler = async (state) => {
    const { newPlayers, executionName } = state;

    for (let player in newPlayers) {
        const playerId = newPlayers[player]
        const userName = await TwitterService.getUserName(playerId);
        let ticket = await generateCard(playerId, userName, executionName);
        await TwitterService.sendDirectMessageWithTicket(playerId, "sua cartela = " + ticket.join('-'));
    };

    return {
        ...state,
        currentTimeISO: new Date().toISOString()
    }
}