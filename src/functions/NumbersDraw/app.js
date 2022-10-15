const OauthService = require('../Services/OAuthHelperService');
const DynamoDBService = require('../Services/DynamoDBHelperService');

const { board, images } = require('../assets');

const createMedia = (text) => OauthService.oauthPost('https://upload.twitter.com/1.1/media/upload.json', {
    media_data: images[text],
    media_category: "tweet_image"
}, 'multipart/form-data');

const getNumberGroup = (number) => {
    console.log(`trying to get group for number ${number}`);
    return board.filter(numberGroup => number >= numberGroup.min && number <= numberGroup.max)[0].key;
}

const pickRandomNumber = (numbers) => {
    return numbers.sort(() => 0.5 - Math.random())[0];
}

const postSelectedNumber = async (group, number) => {
    //var numberMedia = await createMedia(number);
    //var groupMedia = await createMedia(group);
    return await OauthService.oauthPost('https://api.twitter.com/1.1/statuses/update.json', {
        status: `Na letra ${group}: ${number}`//,
        //media_ids: `${groupMedia.media_id_string},${numberMedia.media_id_string}`
    }, 'application/x-www-form-urlencoded');
}

exports.handler = async ({ state }) => {
    let calledNumbers = state.calledNumbers ?? [];
    let numbers = await DynamoDBService.getBingoNumbers();
    let selectedNumber = pickRandomNumber(numbers);
    let group = getNumberGroup(selectedNumber);
    var numberCall = await postSelectedNumber(group, selectedNumber);
    await DynamoDBService.updateNumbers(numbers, selectedNumber);
    calledNumbers.push(selectedNumber);

    return {
        ...state,
        lastCallDate: new Date(numberCall.created_at).toISOString(),
        count: 1 + (state.count ?? 0),
        calledNumbers,
        publishedMessages: [...state.publishedMessages, numberCall.id_str]
    }
}