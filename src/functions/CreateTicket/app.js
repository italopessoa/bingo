const crypto = require('crypto');
const { twitterMessageFactory, MessageTypes, getTwitterUserName } = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');
const { board } = require('../assets');

const bingoNumbers = [...Array(75)].map((item, currentIndex) => {
    return currentIndex + 1
});

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const getTicketNumbersByGroup = (numbers, size, minimumValue, maximumValue) => {
    if (getRandomNumber(1, 9999999) % 2 == 0) {
        return fillByOrder(numbers, size, minimumValue, maximumValue);
    } else {
        return fillRandom(size, minimumValue, maximumValue);
    }
}

const generateCardNumbers = () => {

    var ticket = [];
    board.forEach((numberGroup => {
        var ticketColumn = getTicketNumbersByGroup(bingoNumbers, numberGroup.cardMax, numberGroup.min, numberGroup.max);
        ticket = ticket.concat(ticketColumn);
    }));

    return ticket;
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

const fillByOrder = (numbers, size, min, max) => {
    var columnNumbersRange = numbers
        .filter(number => {
            return number >= min && number <= max;
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

async function createAndSendTicketMessage(newPlayers, player, executionName) {
    let body = {
        messageType: MessageTypes.DIRECT_MESSAGE
    };

    const playerId = newPlayers[player];
    const userName = await getTwitterUserName(playerId);
    let ticket = await generateCard(playerId, userName, executionName);

    body.message = "sua cartela = " + ticket.join('-');
    body.recipientId = playerId;

    let messageFactory = twitterMessageFactory(body);
    let message = await messageFactory.create();
    await messageFactory.send(message);
}

exports.handler = async (state) => {
    const { newPlayers, executionName } = state;

    for (let player in newPlayers) {
        await createAndSendTicketMessage(newPlayers, player, executionName);
    };

    return {
        ...state,
        newPlayers: [],
        currentTimeISO: new Date().toISOString()
    }
}


