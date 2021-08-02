//search/tweets.json?q=%23superbowl&result_type=recent
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

const { oauthGet } = require('../oauth-utils');

const searchWinners = () => oauthGet(`https://api.twitter.com/1.1/search/tweets.json?q=%23bingobati&result_type=recent`);

const getUserCard = async (user_id, message_id_str) => {
    var params = {
        ExpressionAttributeValues: {
            ":userId": user_id
        },
        FilterExpression: "userId = :userId", 
        TableName: "bingo_cards2"
    };
    console.log("user card ",params)
    
    var result = await dynamodb.scan(params).promise();

console.log("RESULT IS ",result)
    if (result.Count > 0) {
        var userCard = result.Items[0].card.split('-').map(n => parseInt(n));
        console.log("GOOD ",userCard)
        return { userName: result.Items[0].userName, userCard, message_id_str };
    }
    return null;
}

const checkWinners = (calledNumbers, userCards) => {
    console.log("check winners ", userCards)
    var x = userCards
            .filter(item => item.userCard.filter(n => calledNumbers.includes(n)).length > 0 )
            .map(item => item);
    console.log("mapping = ",x);
    return x;
}

const findWinnerHandler = async (state) => {
    const { currentUsers, lastCallDate } = state;
    var users = currentUsers ?? [];
    let winners = await searchWinners();
    console.log("found winners ", console.log(winners.statuses));

    let allUsers = winners.statuses
        .map(({id_str,user,created_at, text}, _) => ({
            id_str,
            created_at,
            screen_name: user.screen_name,
            user_id: user.id_str,
            text
        }))
        //.filter(({ user_id, created_at}) => users.indexOf(user_id) >=0 && new Date(created_at) >= new Date(lastCallDate));        
    
    console.log("WINNES FOUND ", allUsers, lastCallDate);

    console.log("WINNES SORTED ", allUsers.sort((a,b) => (a.created_at <= b.created_at) ? 1 : -1));

    console.log("WINNES FOUND ", allUsers);
    allUsers.sort((a,b) => a.created_at <= b.created_at);
    
    console.log("buscar cartelas");
    var allUserCard = await Promise.all(allUsers.map( ({ user_id, id_str }) =>  getUserCard(user_id, id_str)));
    
    console.log("WINNES SORTED ", allUsers);
    var winnersList = checkWinners(state.calledNumbers, allUserCard);
    console.log("ALGUEM GANHOU? ", winnersList)
    
    return {
        ...state,
        hasWinner: winnersList.length > 0,
        winnersList
    };
};

exports.findWinnerHandler = findWinnerHandler;
