const { 
    findUsersHandler,
    createCardsHandler,
    publishBingoAdvertisiment,
    destroyMessagesHandler,
    callBallHandler,
    findWinnerHandler,
    notifyWinnersHandler
} = require('./steps')

exports.handler = async ({ state, nextStep }) => {
    let newState = {};
    console.log("CURRENT STEP => ", nextStep)
    switch (nextStep) {
        case 'findUsers':
            newState = await findUsersHandler(state);
            break;
        case 'createCards':
            newState = await createCardsHandler(state);
            break;
        case 'callBall':
            newState = await callBallHandler(state);
            break;
        case 'checkWinner':
            newState = await findWinnerHandler(state);
            break;
        case 'notifyWinners':
            newState = await notifyWinnersHandler(state);
            break;
        case 'finish':
            newState = await destroyMessagesHandler(state);
            break;
        default:
            newState = await publishBingoAdvertisiment(state);
            break;
    }

    return {
        body:{
            state: newState
        },
        statusCode: 200
    };
};