const crypto = require('crypto');
const { twitterMessageFactory, MessageTypes, getTwitterUserName } = require('../Services/TwitterHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');
const { board, getBingoNumbers } = require('../assets');

exports.handler = async (state) => {
    await createTicketAndSendPrivateMessage(state.newPlayers, state.executionName);
    return {
        ...state,
        newPlayers: [],
        currentTimeISO: new Date().toISOString()
    }
}

async function createTicketAndSendPrivateMessage(newPlayers, executionName) {
    for (let player in newPlayers) {
        const playerId = newPlayers[player];
        const userName = await getTwitterUserName(playerId);
        let ticket = await generateTicket(playerId, userName, executionName);

        await twitterMessageFactory(MessageTypes.DIRECT_MESSAGE, {
            message: "Sua cartela está pronta",
            recipientId: playerId,
            urls: [
                {
                    label: "Clique aqui para acessar e boa sorte",
                    link: `http://g1.globo.com/execute/${executionName}/player/${playerId}/ticket/${ticket.join(',')}`
                }
            ]
        }).buildAndSend();
    };
}

const generateTicket = async (playerId, username, bingoExecutionName) => {
    let userCard = generateTicketNumbers();
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

const generateTicketNumbers = () => {
    let ticket = [];
    board.forEach((numberGroup => {
        var ticketColumn = getTicketNumbersByGroup(getBingoNumbers(), numberGroup.cardMax, numberGroup.min, numberGroup.max);
        ticket = ticket.concat(ticketColumn);
    }));
    return ticket;
}

const getTicketNumbersByGroup = (numbers, size, minimumValue, maximumValue) => {
    if (getRandomNumber(1, 9999999) % 2 == 0) {
        return fillByOrder(numbers, size, minimumValue, maximumValue);
    } else {
        return fillRandom(size, minimumValue, maximumValue);
    }
}

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

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