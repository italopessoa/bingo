const { twitterMessageFactory, MessageTypes } = require('../Services/TwitterHelperService');
const { board, images } = require('../assets');

exports.handler = async (state) => {
    let calledNumbers = state.calledNumbers;
    let numbers = getNonCalledNumbers(state);
    let numberGroup = getNumberAndGroup(numbers);
    var numberCall = await postSelectedNumber(numberGroup.group, numberGroup.number);
    calledNumbers.push(numberGroup.number);
    const updatedNumbers = getNonCalledNumbers(state.numbers, calledNumbers);

    return {
        ...state,
        lastBallCalledDate: new Date(numberCall.created_at).toISOString(),
        calledNumbers,
        numbers: updatedNumbers,
        numbersCount: updatedNumbers.length,
        publishedMessages: [...state.publishedMessages, numberCall.id_str]
    }
}

const getNonCalledNumbers = ({ numbers, calledNumbers }) => {
    return numbers
        .filter(number => calledNumbers.indexOf(number) < 0);
}

const getNumberAndGroup = (numbers) => {
    var number = pickRandomNumber(numbers);
    return {
        number,
        group: getNumberGroup(number)
    }
}

const pickRandomNumber = (numbers) => {
    return numbers.sort(() => 0.5 - Math.random())[0];
}

const getNumberGroup = (number) => {
    console.log(`trying to get group for number ${number}`);
    return board.filter(numberGroup => number >= numberGroup.min && number <= numberGroup.max)[0].key;
}

const postSelectedNumber = async (group, number) => {
    let body = {
        messageType: MessageTypes.STATUS_MESSAGE_WITH_IMAGE_MEDIA,
        message: `Na letra ${group}: ${number}`,
        mediaImagesBase64: [images[group], images[number]]
    };
    let messageFactory = twitterMessageFactory(body);
    let message = await messageFactory.create();
    return await messageFactory.send(message);
}