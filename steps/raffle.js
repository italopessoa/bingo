var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();
const { oauthPost } = require('../oauth-utils');
const { board, images } = require('../utils');

const createMedia = (text) => oauthPost('https://upload.twitter.com/1.1/media/upload.json', {
        media_data: images[text],
        media_category: "tweet_image"
    }, 'multipart/form-data');

const getGroup = (n) => board.filter(i => n >= i.min && n <= i.max)[0].key;

const getNumbers = async () => {
    var response = await dynamodb.query({
        TableName: "raffle",
        KeyConditionExpression: "raffle = :date",
        ExpressionAttributeValues: {
            ":date": new Date().toLocaleDateString('pt-BR'),
        },
        ScanIndexForward: false,
        Limit: 1
    }).promise();

    let numbers = [];

    if (response.Count == 0) {
        numbers = [...Array(75)]
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
    var numberMedia = await createMedia(number);
    var groupMedia = await createMedia(group);
    return await oauthPost('https://api.twitter.com/1.1/statuses/update.json', {
        status: `Na letra ${group}: ${number}`,
        media_ids: `${groupMedia.media_id_string},${numberMedia.media_id_string}`
    }, 'application/x-www-form-urlencoded');
}

const updateNumbers = async (numbers, selectedNumber) => {

    var params = {
        TableName: "raffle",
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
    let numbers = await getNumbers();
    let selectedNumber = pickRandomNumber(numbers);
    let group = getGroup(selectedNumber);
    var numberCall = await postSelectedNumber(group, selectedNumber);
    await updateNumbers(numbers, selectedNumber);

    return {
        ...state,
        lastCallDate: new Date(numberCall.created_at).toISOString(),
        count: 1 + (state.count ?? 0),
    }
}

exports.callBallHandler = callBallHandler;