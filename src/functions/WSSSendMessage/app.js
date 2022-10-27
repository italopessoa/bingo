async function handler(event) {

    return {
        statusCode: 200,
        body: {
            message: event
        }
    }
}


exports.handler = handler;