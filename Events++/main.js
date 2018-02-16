var currentCookie = 1;
var currentEventID = 1;
var userNamesToPasswords = {};
var userNamesToCookies = {};
var cookiesToUserNames = {};
var userNamesToUsers = {};
var eventIdsToEvents = {};
var publicEventsCategories = ["Sport", "Lan-Party", "Board-Game", "Other"];
var maxCookieTime = 3600000;
var defaultPort = 5000;
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
var eventDiscriptions = ["Live concert!!!", "Movies :)", "Coffee and chill", "Pool Party",  "Football"];
var imgURLs= ["http://az616578.vo.msecnd.net/files/2017/02/28/6362384699061998551682913604_HERO_IBIZA_CLOSING_PARTIES_Privilege.jpg",
    "http://images.clipartpanda.com/movie-night-clipart-9cp4q9xcE.jpeg",
    "https://fthmb.tqn.com/9tIYcqCpS8njB2VIOnChlz_nY5I=/1500x1000/filters:fill(auto,1)/about/Cafeconleche-56fcf86e5f9b586195b73dbf.JPG",
    "http://lathampool.com/trilogy/wp-content/uploads/sites/5/2017/05/trilogy-pools-home-1.jpg",
    "http://content.active.com/Assets/Active.com+Content+Site+Digital+Assets/Kids/Articles/Soccer+Tips/carousel.jpg", ""];

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('static_data'));
app.set('port', (process.env.PORT || defaultPort));

app.post('/register/:username/:password/:email/:birthday/:sex', function(req, res, next) {
    var userName = req.params.username;
    var password = userNamesToPasswords[userName];

    if (password){
        res.status(500).json({ error: 'The user name already exists' });
    }
    else{
        var userEmail = req.params.email;
        var userBirthday = req.params.birthday;
        var userSex = req.params.sex;
        var user = { name: userName, email: userEmail, birthday: userBirthday, age: calculateMyAge(userBirthday),
            sex: userSex, friends:[], friendsRequests:[], events:[] };

        userNamesToPasswords[userName] = req.params.password;
        userNamesToUsers[userName] = user;
        res.status(200).json({ message: 'The user has been registered' });
    }
});

app.post('/login/:username/:password', function(req, res,next) {
        var userName = req.params.username;
        var password = userNamesToPasswords[userName];

        if (password) {
            if (password === req.params.password) {
                var cookie = currentCookie;
                userNamesToCookies[userName] = cookie;
                cookiesToUserNames[cookie] = userName;
                var user = userNamesToUsers[userName];
                user["age"] = calculateMyAge(user.birthday);
                currentCookie++;
                res.cookie('appId', cookie, {maxAge: maxCookieTime});
                res.status(200).send("/public/AfterLogin.html")
            }
            else {
                res.status(500).json({error: 'Wrong user name or password'});
            }
        }
        else {
            res.status(500).json({error: 'Wrong user name or password'});
        }
});

function calculateMyAge(birthday) {
    var birthdayDate = new Date(birthday);
    var ageDifferenceByMiliSeconds = Date.now() - birthdayDate.getTime();
    var ageDate = new Date(ageDifferenceByMiliSeconds);

    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

app.use('/authenticate',function(req,res,next){
    var isCookieCheckPass = cookieCheck(req);

    if (isCookieCheckPass) {
        res.status(200).json({ message: 'Pass' });
    }
    else{
        res.status(500).json({ error: 'Cookie check fail' });
    }
});

app.use('/',function(req,res,next){
    var isCookieCheckPass = cookieCheck(req);

    if (isCookieCheckPass) {
        next();
    }
    else{
        res.redirect("/public/Home.html")
    }
});

function cookieCheck(req){
    var cookie = req.cookies.appId;
    var userName = cookiesToUserNames[cookie];
    var isCookieCheckPass = false;

    if (userName) {
        isCookieCheckPass = true;
    }

    return isCookieCheckPass;
}

function getUserName(req){
    var cookie = req.cookies.appId;
    var userName = cookiesToUserNames[cookie];

    return userName;
}

app.post('/addFriend/:friendUserName',function (req,res,next) {
    var userName = getUserName(req);
    var user = userNamesToUsers[userName];
    var friendUserName = req.params.friendUserName;
    var friendUser = userNamesToUsers[friendUserName];

    if (friendUser){
        var friendRequestIndex = friendUser.friendsRequests.indexOf(userName);
        var RequestIndex = user.friendsRequests.indexOf(friendUserName);
        var friendIndex = friendUser.friends.indexOf(userName);

        if (friendRequestIndex === -1 && friendIndex === -1 && RequestIndex === -1){
            friendUser.friendsRequests.push(userName);
            res.status(200).json({ message: userName + ' send friend request to ' + friendUserName});
        }
        else{
            res.status(500).json({ error: 'Friend request has already sent' });
        }
    }
    else{
        res.status(500).json({ error: friendUserName + ' does not exist' });
    }
});

app.get('/friendRequests',function (req,res,next) {
    var userName = getUserName(req);

    res.status(200).json(userNamesToUsers[userName].friendsRequests);
});

app.post('/acceptFriend/:friendUserName',function (req,res,next) {
    var userName = getUserName(req);
    var friendUserName = req.params.friendUserName;
    var friendsRequests = userNamesToUsers[userName].friendsRequests;
    var indexOfFriend = friendsRequests.indexOf(friendUserName);

    if (indexOfFriend > -1) {
        friendsRequests.splice(indexOfFriend, 1);
        userNamesToUsers[userName].friends.push(friendUserName);
        userNamesToUsers[friendUserName].friends.push(userName);
        res.status(200).json({ message: userName + ' accepted ' + friendUserName });
    }
    else{
        res.status(500).json({ error: 'There is no friend request from ' + friendUserName });
    }
});

app.get('/friends',function (req,res,next) {
    var userName = getUserName(req);

    res.status(200).json(userNamesToUsers[userName].friends);
});

app.post('/createPrivateEvent/:name/:location/:dateAndTime/:participants/:imgURL/:description',function(req,res,next){
    var userName = getUserName(req);
    var eventName = req.params.name;
    var eventLocation = req.params.location;
    var eventDateAndTime = req.params.dateAndTime;
    var eventParticipants = JSON.parse(req.params.participants);
    var eventImageURL = req.params.imgURL;
    var eventDescription = req.params.description;

    eventParticipants.push(userName);
    var event = {name: eventName, location: eventLocation, dateAndTime: eventDateAndTime, creator: userName,
        participants: eventParticipants, imgURL: eventImageURL, description: eventDescription,
        attendingUsers: [userName], noResponseUsers: [],notGoingUsers: [], type: "Private", id: currentEventID};

    registerParticipants(eventParticipants,currentEventID, userName, event);
    eventIdsToEvents[currentEventID] = event;
    userNamesToUsers[userName].events.push(currentEventID);
    currentEventID++;

    res.status(200).json({ message: 'Private event was created' });
});

app.post('/createPublicEvent/:name/:category/:location/:dateAndTime/:maxAge/:minAge/:maxParticipants/:participants/:imgURL/:description/',function(req,res,next){
    var userName = getUserName(req);
    var eventName = req.params["name"];
    var eventCategory = req.params["category"];
    var eventLocation = req.params["location"];
    var eventDateAndTime = req.params["dateAndTime"];
    var eventMaxAge = req.params["maxAge"];
    var eventMinAge = req.params["minAge"];
    var eventMaxParticipants = req.params["maxParticipants"];
    var eventImageURL = req.params["imgURL"];
    var eventDescription = req.params["description"];
    var eventParticipants = JSON.parse(req.params["participants"]);

    eventParticipants.push(userName);
    var event = {name: eventName, category: eventCategory, location: eventLocation, creator: userName,
        dateAndTime: eventDateAndTime, maxAge: eventMaxAge, minAge: eventMinAge,
        maxParticipants: eventMaxParticipants,imgURL: eventImageURL, description: eventDescription,
        participants: eventParticipants, attendingUsers: [userName], noResponseUsers: [], notGoingUsers: [],
        requestToParticipantUsers: [], type: "Public", id: currentEventID};

    registerParticipants(eventParticipants,currentEventID, userName, event);
    eventIdsToEvents[currentEventID] = event;
    userNamesToUsers[userName].events.push(currentEventID);
    currentEventID++;

    res.status(200).json({ message: 'Public event was created' });
});

function registerParticipants(participants, currentEventID, eventCreatorUserName, event){
    for(var i = 0; i<  participants.length; i++){
        if(eventCreatorUserName !== participants[i]){
            userNamesToUsers[participants[i]].events.push(currentEventID);
            event.noResponseUsers.push(participants[i]);
        }
    }
}

app.post('/acceptEventRequest/:eventId',function (req,res,next) {
    changeRSVP("attending", res, req);
});

app.post('/rejectEventRequest/:eventId',function (req,res,next) {
    changeRSVP("not going", res, req);
});

function changeRSVP(status, res, req) {
    var userName = getUserName(req);
    var eventId = req.params.eventId;
    var event = eventIdsToEvents[eventId];

    if (event) {
        var eventIndex = userNamesToUsers[userName].events.indexOf(parseInt(eventId));
        if (eventIndex > -1) {
            changeEventStatus(status, event, userName, res);
        }
        else {
            res.status(500).json({error: 'Event ID does not found'});
        }
    }
    else {
        res.status(500).json({error: 'Event ID does not exist'});
    }
}

function changeEventStatus(status, event, userName, res) {
    if (status === "attending"){
        var eventIndex = event.attendingUsers.indexOf(userName);
        if (!(eventIndex > -1)){
            if (event.type === "Public") {
                if (event.attendingUsers.length < event.maxParticipants) {
                    changeToAttending(event, userName);
                    res.status(200).json({message: userName + ' ' + status + ' to ' + event.name});
                }
                else {
                    res.status(500).json({ error: 'The event is full' });
                }
            }
            else {
                changeToAttending(event, userName);
                res.status(200).json({message: userName + ' ' + status + ' to ' + event.name});
            }
        }
    }
    else{
        var eventIndex = event.notGoingUsers.indexOf(userName);
        if(!(eventIndex > -1)){
            eventIndex = event.noResponseUsers.indexOf(userName);
            if(eventIndex > -1){
                event.noResponseUsers.splice(eventIndex, 1);
            }
            else{
                event.attendingUsers.splice(eventIndex, 1);
            }

            event.notGoingUsers.push(userName);
        }
        res.status(200).json({message: userName + ' ' + status + ' to ' + event.name});
    }
}

function changeToAttending(event, userName) {
    var eventIndex = event.noResponseUsers.indexOf(userName);
    if (eventIndex > -1){
        event.noResponseUsers.splice(eventIndex, 1);
    }
    else{
        event.notGoingUsers.splice(eventIndex, 1);
    }

    event.attendingUsers.push(userName);
}

app.get('/getEvent/:eventId',function(req,res,next){
    var userName = getUserName(req);
    var eventId = req.params.eventId;

    if (eventIdsToEvents[eventId]){
        var eventIndex = userNamesToUsers[userName].events.indexOf(parseInt(eventId));
        var event = eventIdsToEvents[eventId];
        var isRelevantPublicEvent = checkIfRelevantPublicEvent(event, userName);

        if(eventIndex > -1 || isRelevantPublicEvent){
            var eventStatus = getStatus(event,userName);

            event["status"] = eventStatus;
            event["isAdmin"] = event.creator === userName;
            res.status(200).json(event);
        }
        else{
            res.status(500).json({ error: "The user does not has this event" });
        }
    }
    else{
        res.status(500).json({ error: "Event does not found" });
    }
});

function getStatus(event,userName){
    var status;

    if (event.participants.indexOf(userName) > -1){
        if (event.attendingUsers.indexOf(userName) > -1){
            status = "Yes";
        }
        else if (event.noResponseUsers.indexOf(userName) > -1){
            status = "Maybe";
        }
        else if (event.notGoingUsers.indexOf(userName) > -1){
            status = "No";
        }
        else if (event.type === "Public"){
            if (event.requestToParticipantUsers.indexOf(userName) > -1){
                status = "Pending";
            }
        }
        else{
            status = "NotPartOfTheEvent";
        }
    }
    else{
        status = "NotPartOfTheEvent";
    }

    return status;
}

app.get('/getEvents',function(req,res,next){
    var userName = getUserName(req);
    var userEvents = [];

    for (var i = 0; i < userNamesToUsers[userName].events.length; i++){
        var eventId = userNamesToUsers[userName].events[i];
        var event = eventIdsToEvents[eventId];
        var eventStatus = getStatus(event,userName);

        event["status"] = eventStatus;
        event["isAdmin"] = event.creator === userName;
        userEvents.push(event);
    }

    res.status(200).json(userEvents);
});

app.get('/getCategories', function (req, res, next) {
    res.status(200).json(publicEventsCategories);
});

app.get('/findPublicEvents/:eventCategory', function(req, res, next) {
    var userName = getUserName(req);
    var eventCategory = req.params.eventCategory;
    var publicEvents = [];

    for (var eventId in eventIdsToEvents) {
        var event = eventIdsToEvents[eventId];
        var isRelevantPublicEvent = checkIfRelevantPublicEvent(event, userName, eventCategory);

        if (isRelevantPublicEvent)
        {
            var eventStatus = getStatus(event,userName);

            event["status"] = eventStatus;
            event["isAdmin"] = event.creator === userName;
            publicEvents.push(event);
        }
    }

    res.status(200).json(publicEvents);
});

function checkIfRelevantPublicEvent(event, userName, eventCategory)
{
    var isRelevantPublicEvent = false;
    var myAge = userNamesToUsers[userName].age;

    if (event.type === "Public" ){
        var userNameIndex = event.participants.indexOf(userName);

        if ((eventCategory === event.category || !eventCategory) && event.attendingUsers.length < event.maxParticipants &&
            myAge <= event.maxAge && myAge >= event.minAge && userNameIndex === -1){
            isRelevantPublicEvent = true;
        }
    }

    return isRelevantPublicEvent;
}

app.get('/getUserData', function (req, res, next) {
    var userName = getUserName(req);
    res.status(200).json(userNamesToUsers[userName]);
});


app.post('/requestToParticipantInPublicEvent/:eventId', function (req, res, next) {
    var eventId = req.params.eventId;
    var event = eventIdsToEvents[parseInt(eventId)];
    var userName = getUserName(req);

    if (event){
        if (event.type === "Public"){
            var userNameIndex = event.participants.indexOf(userName);

            if(!(userNameIndex > -1)){
                event.participants.push(userName);
                event.requestToParticipantUsers.push(userName);
                userNamesToUsers[userName].events.push(parseInt(eventId));
                res.status(200).json({ massage: "The user added to the event, pending to approval" });
            }
            else {
                res.status(500).json({ error: "The user is already participant in the event" });
            }
        }
        else{
            res.status(500).json({ error: "This is private event" });
        }
    }
    else{
        res.status(500).json({ error: "Event does not exist" });
    }
});

app.post('/acceptParticipationRequest/:eventId/:pendingUserName', function (req, res, next) {
    var userName = getUserName(req);
    var eventId = req.params.eventId;
    var event = eventIdsToEvents[parseInt(eventId)];
    var pendingUserName = req.params.pendingUserName;
    var pendingUser = userNamesToUsers[pendingUserName];

    if (event && pendingUser){
        if (event.creator === userName){
            var pendingUserIndex = event.requestToParticipantUsers.indexOf(pendingUserName);

            if (pendingUserIndex > -1){
                if (event.attendingUsers.length < event.maxParticipants){
                    event.attendingUsers.push(pendingUserName);
                    event.requestToParticipantUsers.splice(pendingUserIndex, 1);
                }
                else {
                    res.status(500).json({ error: "The event is full" });
                }
            }
            else{
                res.status(500).json({ error: pendingUserName + " does not ask to join to this event" });
            }
        }
        else{
            res.status(500).json({ error: "You are not the creator of the event" });
        }
    }
    else{
        res.status(500).json({ error: "Event or pending user name does not exist" });
    }
});

app.post('/rejectParticipationRequest/:eventId/:pendingUserName', function (req, res, next) {
    var userName = getUserName(req);
    var eventId = req.params.eventId;
    var event = eventIdsToEvents[parseInt(eventId)];
    var pendingUserName = req.params.pendingUserName;
    var pendingUser = userNamesToUsers[pendingUserName];

    if (event && pendingUser){
        if (event.creator === userName){
            var pendingUserIndex = event.requestToParticipantUsers.indexOf(pendingUserName);
            var eventIndex = pendingUser.events.indexOf(parseInt(eventId));

            if (pendingUserIndex > -1){
                event.requestToParticipantUsers.splice(pendingUserIndex, 1);
                pendingUserIndex = event.participants.indexOf(pendingUserName);
                event.participants.splice(pendingUserIndex, 1);
                pendingUser.events.splice(eventIndex, 1);
            }
            else{
                res.status(500).json({ error: pendingUserName + " does not ask to join to this event" });
            }
        }
        else{
            res.status(500).json({ error: "You are not the creator of the event" });
        }
    }
    else{
        res.status(500).json({ error: "Event or pending user name does not exist" });
    }
});

app.use('/',function(req,res,next){
    var isCookieCheckPass = cookieCheck(req);

    if (isCookieCheckPass) {
        res.redirect("/public/AfterLogin.html")
    }
    else{
        res.redirect("/public/Home.html")
    }
});

app.set('json spaces', 40);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


// From this line it all a dummy data and not part of the real server
init();

function init(){

    for(var i = 1; i <= 10; i++){
        createUser("" + i, "" + i, i);
    }

    addFriends1("" + 1);

    addFriends2("" + 2);

    createEvents();
}

function createUser(userName, password, ageFactor) {
    userNamesToPasswords[userName] = password;
    var oneYear = 31610421331;
    var baseAge = 20;
    var userBirthday = new Date(Date.now() - ((baseAge + ageFactor) * oneYear));
    var user = { name: userName, email: "mail@mail.com", birthday: userBirthday, age: calculateMyAge(userBirthday),
        sex: "Male", friends:[], friendsRequests:[], events:[] };

    userNamesToUsers[userName] = user;
}

function addFriends1(userName){
    var friend = parseInt(userName) + 1;

    for(; friend < 9; friend++){
        userNamesToUsers[userName].friends.push("" + friend);
        userNamesToUsers["" + friend].friends.push(userName);
    }

    userNamesToUsers[userName].friendsRequests.push("9");
    userNamesToUsers[userName].friendsRequests.push("10");
}

function addFriends2(userName){
    var friend = parseInt(userName) + 1;

    for(; friend <= 5; friend++){
        userNamesToUsers[userName].friends.push("" + friend);
        userNamesToUsers["" + friend].friends.push(userName);
    }
}

function createEvents(){
    for (var i = 1; i <= 10; i++){
        var privateEventName = "Private event of " + i;
        var userName = "" + i;
        var user = userNamesToUsers[userName];
        var dateAndTime = new Date(Date.now());
        var description = eventDiscriptions[i % eventDiscriptions.length];
        var imgURL = imgURLs[i % imgURLs.length];
        var event = {name: privateEventName, location: "Tel Aviv", dateAndTime: dateAndTime, creator: userName,
            participants: [userName], imgURL: imgURL, description: description,
            attendingUsers: [userName], noResponseUsers: [],notGoingUsers: [], type: "Private", id: currentEventID};

        for (var j = 0;  j < user.friends.length; j++)
        {
            event.participants.push(user.friends[j]);
        }

        registerParticipants(event.participants,currentEventID, userName, event);
        eventIdsToEvents[currentEventID] = event;
        userNamesToUsers[userName].events.push(currentEventID);
        currentEventID++;
    }

    for (var i = 1; i <= 10; i++) {
        var userName = "" + i;
        var user = userNamesToUsers[userName];
        var eventName = "Public event of " + i;
        var eventCategory = publicEventsCategories[i % publicEventsCategories.length];
        var dateAndTime = new Date(Date.now());
        var eventMaxAge = parseInt(user.age);
        var eventMinAge = 20;
        var eventMaxParticipants = 5;
        var description = eventDiscriptions[i % eventDiscriptions.length];
        var imgURL = imgURLs[i % imgURLs.length];
        var event = {
            name: eventName, category: eventCategory, location: "Tel Aviv", creator: userName,
            dateAndTime: dateAndTime, maxAge: eventMaxAge, minAge: eventMinAge,
            maxParticipants: eventMaxParticipants, imgURL: imgURL, description: description,
            participants: [userName], attendingUsers: [userName], noResponseUsers: [], notGoingUsers: [],
            requestToParticipantUsers: [], type: "Public", id: currentEventID
        };

        registerParticipants(event.participants, currentEventID, userName, event);
        eventIdsToEvents[currentEventID] = event;
        userNamesToUsers[userName].events.push(currentEventID);
        currentEventID++;
    }
}