//search/tweets.json?q=%23superbowl&result_type=recent

const { oauthGet } = require('../oauth-utils');

const searchWinners = () => oauthGet(`https://api.twitter.com/1.1/search/tweets.json?q=%23bingobati&result_type=recent`);

const findWinnerHandler = async (state) => {
    const { currentUsers, lastCallDate } = state;
    var users = currentUsers ?? [];
    let winners = await searchWinners();
    console.log("found winners ", console.log(winners.statuses.length));

    let allUsers = winners.statuses
        .map(({id_str,user,created_at, text}, _) => ({
            id_str,
            created_at,
            screen_name: user.screen_name,
            user_id: user.id_str,
            text
        }));
        //.filter(({user_id,created_at}) => users.indexOf(user_id) >=0 && new Date(created_at) >= new Date(lastCallDate));

        console.log("WINNES FOUND ", allUsers);
    
    console.log("WINNES SORTED ", allUsers.sort((a,b) => (a.created_at <= b.created_at) ? 1 : -1));

        console.log("WINNES FOUND ", allUsers);
        allUsers.sort((a,b)=>a.created_at <= b.created_at);
    
    console.log("WINNES SORTED ", allUsers);
    return {
        ...state
    };
};

exports.findWinnerHandler = findWinnerHandler;
