import { postStatusUpdate } from '../Services/TwitterHelperService';
import { getBingoNumbers, updateNumbers } from '../Services/DynamoDBHelperService';

import { board, images } from '../assets';

const getNumberGroup = (number) => {
    console.log(`trying to get group for number ${number}`);
    return board.filter(numberGroup => number >= numberGroup.min && number <= numberGroup.max)[0].key;
}

const pickRandomNumber = (numbers) => {
    return numbers.sort(() => 0.5 - Math.random())[0];
}

const postSelectedNumber = async (group, number) => {
    // var numberMedia = await TwitterService.createImageMedia(images[number]);
    // var groupMedia = await TwitterService.createImageMedia(images[group]);
    return await postStatusUpdate({
        status: `Na letra ${group}: ${number}`//,
        //media_ids: `${groupMedia.media_id_string},${numberMedia.media_id_string}`
    });
}

export async function handler(state) {
    let calledNumbers = state.calledNumbers ?? [];
    let numbers = await getBingoNumbers();
    let selectedNumber = pickRandomNumber(numbers);
    let group = getNumberGroup(selectedNumber);
    var numberCall = await postSelectedNumber(group, selectedNumber);
    await updateNumbers(numbers, selectedNumber);
    calledNumbers.push(selectedNumber);

    return {
        ...state,
        lastBallCalledDate: new Date(numberCall.created_at).toISOString(),
        count: 1 + (state.count ?? 0),
        calledNumbers,
        publishedMessages: [...state.publishedMessages, numberCall.id_str]
    }
}