var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();
const OauthService = require('../../oauth-utils');
const { board, images } = require('../../utils');

const createMedia = (text) => OauthService.oauthPost('https://upload.twitter.com/1.1/media/upload.json', {
    media_data: images[text],
    media_category: "tweet_image"
}, 'multipart/form-data');

const getNumberGroup = (number) =>
    board.filter(numberGroup => number >= numberGroup.min && number <= numberGroup.max)[0].key;

const getBingoNumbers = async () => {
    var response = await dynamodb.query({
        TableName: "BingoRaffle",
        KeyConditionExpression: "raffle = :date",
        ExpressionAttributeValues: {
            ":date": new Date().toLocaleDateString('pt-BR'),
        },
        ScanIndexForward: false,
        Limit: 1
    }).promise();

    let numbers = [];

    if (response.Count == 0) {
        numbers = [...Array(25)]
            .map((item, currentIndex) => currentIndex + 1)
            .sort(() => 0.5 - Math.random());
    } else {
        numbers = response.Items[0].numbers;
    }
    return numbers;
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

const updateNumbers = async (numbers, selectedNumber) => {

    var params = {
        TableName: "BingoRaffle",
        Item: {
            raffle: new Date().toLocaleDateString('pt-BR'),
            date: new Date().toISOString(),
            numbers: numbers.filter(i => i != selectedNumber),
            selectedNumber: selectedNumber
        },
        ReturnValues: "ALL_OLD",
        ReturnItemCollectionMetrics: "SIZE"
    };

    await dynamodb.put(params).promise();
}

const callBallHandler = async (state) => {
    let calledNumbers = state.calledNumbers ?? [];
    let numbers = await getBingoNumbers();
    let selectedNumber = pickRandomNumber(numbers);
    let group = getNumberGroup(selectedNumber);
    var numberCall = await postSelectedNumber(group, selectedNuber);
    await updateNumbers(nubers, selectedNumber);
    calledNumbers.push(selectedNumber);

    return {
        ...state,
        lastCallDate: new Date(numberCall.created_at).toISOString(),
        count: 1 + (state.count ?? 0),
        calledNumbers,
        publishedMessages: [...state.publishedMessages, numberCall.id_str]
    }
}

exports.callBallHandler = callBallHandler;