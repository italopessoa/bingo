const { 
    findUsersHandler,
    createCardsHandler,
    publishBingoAdvertisiment,
    destroyMessagesHandler,
    callBallHandler,
    findWinnerHandler 
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
        default:
            if (state && state.ads_message) {
                newState = await destroyMessagesHandler(state);
            } else {
                newState = await publishBingoAdvertisiment(state);
            }
            break;
    }

    return {
        body:{
            state: newState
        },
        statusCode: 200
    };
};