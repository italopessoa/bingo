const {
    findUsersHandler,
    createCardsHandler,
    publishBingoPosterHandler,
    destroyMessagesHandler,
    callBallHandler,
    findWinnerHandler,
    notifyWinnersHandler
} = require('./steps');

exports.handler = async ({ state, nextStep }) => {
    let newState = {};
    const steps = {
        'createCards': createCardsHandler,
        'findUsers': findUsersHandler,
        'callBall': callBallHandler,
        'checkWinner': findWinnerHandler,
        'notifyWinners': notifyWinnersHandler,
        'finish': destroyMessagesHandler
    }
    var handler = steps[nextStep] ?? publishBingoPosterHandler;
    newState = await handler(state);

    return {
        body: {
            state: newState
        },
        statusCode: 200
    };
};