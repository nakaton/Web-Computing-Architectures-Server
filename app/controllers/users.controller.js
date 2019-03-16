const Users = require('../models/users.model');
const jwt = require('jsonwebtoken'); // use for create token
const crypto = require('crypto');

/**
 * Register as a new user.
 */
exports.postUser = async function (req, res) {
    //Extract query params from request into RegisterUserRequest
    let registerUserRequest = new Users.RegisterUserRequest(req.body);

    console.log("username: " + registerUserRequest.username);
    console.log("email: " + registerUserRequest.email);
    console.log("givenName: " + registerUserRequest.givenName);
    console.log("familyName: " + registerUserRequest.familyName);
    console.log("password: " + registerUserRequest.password);

    let regexForEmail = /^\w+@[a-zA-Z0-9]{2,10}(?:\.[a-z]{2,4}){1,3}$/;
    if(!regexForEmail.test(registerUserRequest.email)
        || (registerUserRequest.password != null && registerUserRequest.password == "")){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }

    let md5 = crypto.createHash('md5');
    md5.update(registerUserRequest.password);
    registerUserRequest.password = md5.digest('hex');

    let sqlCommand = "insert into User (username, email, given_name, family_name, password) values (?,?,?,?,?)";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Users.postUser(sqlCommand, registerUserRequest);

        res.statusMessage = 'Created';
        res.status(201)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

/**
 * Login as an existing user.
 */
exports.login = async function (req, res) {
    //Extract query params from request into LoginRequest
    let loginRequest = new Users.LoginRequest(req.body);

    console.log("username: " + loginRequest.username);
    console.log("email: " + loginRequest.email);
    console.log("password: " + loginRequest.password);

    // Password is necessity. Otherwise return 'Bad Request'
    if(loginRequest.password == null || loginRequest.password == ""){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    let md5 = crypto.createHash('md5');
    md5.update(loginRequest.password);
    loginRequest.password = md5.digest('hex');

    let sqlCommand = "select user_id as userId, " +
        "auth_token as token " +
        "from User " +
        "where password = '" + loginRequest.password +"'";

    let sqlByUsername = "";
    let sqlByEmail = "";
    let results = "";

    //Either username or email may be used. Otherwise return 'Bad Request'
    if(loginRequest.email != undefined){
        sqlByEmail = sqlCommand + " and email = '" + loginRequest.email + "' "
        console.log("sqlByEmail: " + sqlByEmail);
        results = await Users.isUserExist(sqlByEmail);
    }

    if (loginRequest.username != undefined){
        sqlByUsername = sqlCommand + " and username = '" + loginRequest.username + "' "
        console.log("sqlByUsername: " + sqlByUsername);

        if(results.length <= 0){
            results = await Users.isUserExist(sqlByUsername);
        }
    }

    try {
        // Input user doesn't exist
        if(results.length <= 0){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }else{
            //Create token
            let payload = {
                username:loginRequest.username,
                email:loginRequest.email,
                password:loginRequest.password
            }
            try{
                let token = jwt.sign(payload, 'jwt', {
                    expiresIn: 60*60*1  // expire in one hour
                })
            }catch (err) {
                if (!err.hasBeenLogged) console.error(err);
                res.statusMessage = 'Bad Request';
                res.status(501)
                    .send();
                return;
            }
            let saveTokenSql = "update User set auth_token = ? where user_id = ?;"
            try{
                await Users.saveToken(saveTokenSql, token, results[0].userId);
                results[0].token = token;

                res.statusMessage = 'OK';
                res.status(200)
                    .json(results[0]);
                return;
            }catch (err) {
                if (!err.hasBeenLogged) console.error(err);
                res.statusMessage = 'Bad Request';
                res.status(500)
                    .send();
                return;
            }
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}

/**
 * Logs out the currently authorised user.
 */
exports.logout = async function (req, res) {
    //Extract token from request Header
    let token = req.header('X-Authorization');

    console.log("token: " + token);

    let sqlCommand = "select user_id as userId " +
        "from User where auth_token = '" + token +"'";

    console.log("sqlCommand: " + sqlCommand);

    try{
        const results = await Users.checkToken(sqlCommand, token);
        if(results.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
        }else{
            let updateTokenSql = "update User set auth_token = null where user_id = ?;"
            try{
                await Users.clearToken(updateTokenSql, results[0].userId);
                res.statusMessage = 'OK';
                res.status(200)
                    .send();
            }catch (err) {
                if (!err.hasBeenLogged) console.error(err);
                res.statusMessage = 'Bad Request';
                res.status(400)
                    .send();
            }
        }
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

/**
 * Retrieve information about a user.
 */
exports.getUser = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');
    let isEmailAvailable = false;
    let availableResult = "";

    console.log("userId: " + userId);

    //Authorise check
    let sqlByToken = "select user_id as userId from User where auth_token = ?";
    try{
        const user = await Users.getUserByToken(sqlByToken, token);

        //User authorize check by token
        if(user.length > 0){
            if(userId == user[0].userId){
                isEmailAvailable = true;
            }
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    let sqlCommand = "select username as username, " +
        "email as email, " +
        "given_name as givenName, " +
        "family_name as familyName from User where user_id = ?";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Users.getUserByUserId(sqlCommand, userId);
        if (results != null && results != ""){
            if(isEmailAvailable){
                availableResult = {
                    "username": results[0].username,
                    "email":results[0].email,
                    "givenName":results[0].givenName,
                    "familyName":results[0].familyName
                }
            }else{
                availableResult = {
                    "username": results[0].username,
                    "givenName":results[0].givenName,
                    "familyName":results[0].familyName
                }
            }
            res.statusMessage = 'OK';
            res.status(200)
                .json(availableResult);
        }else{
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

/**
 * Change a user's details.
 */
exports.patchUser = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');
    let changeUserDetailsRequest = new Users.ChangeUserDetailsRequest(req.body);

    console.log("userId: " + userId);
    console.log("token: " + token);

    let sqlByUserId = "select auth_token as token, " +
        "given_name as giveName, " +
        "family_name as familyName, " +
        "password as password " +
        "from User where user_id = ?";

    let sqlByToken = "select user_id as userId from User where auth_token = ?";

    console.log("sqlByUserId: " + sqlByUserId);
    console.log("sqlByToken: " + sqlByToken);

    try {
        const resultsByUserId = await Users.getUserByUserId(sqlByUserId, userId);
        const resultsByToken = await Users.getUserByToken(sqlByToken, token);

        //should return 403 when valid user data is provided but authenticated as a different user
        if (resultsByToken.length > 0) {
            if(resultsByToken[0].userId != userId){
                res.statusMessage = 'Forbidden';
                res.status(403)
                    .send();
                return;
            }
        }

        if (resultsByUserId.length > 0) {
            if (resultsByUserId[0].token == null || resultsByUserId[0].token == "") {
                res.statusMessage = 'Unauthorized';
                res.status(401)
                    .send();
                return;
            }

            //should return 400 when no changes are provided
            if(resultsByUserId[0].givenName == changeUserDetailsRequest.givenName &&
                resultsByUserId[0].familyName == changeUserDetailsRequest.familyName &&
                resultsByUserId[0].password == changeUserDetailsRequest.password){
                res.statusMessage = 'Bad Request';
                res.status(400)
                    .send();
                return;
            }
        }

        //should return 400 when a change of family name is present but has an empty value
        if(changeUserDetailsRequest.familyName == null || changeUserDetailsRequest.familyName == ""){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }

        //should return 400 when a change of password is present but has a number value
        let numberReg = /[0-9]+/;
        let isNumber = numberReg.test(changeUserDetailsRequest.password);
        if(isNumber){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }

        if (resultsByUserId.length > 0){

            if(resultsByUserId[0].token == token){
                let updateSql = "update User set given_name = ?, family_name = ?, password = ? " +
                    "where user_id = ?"
                try{
                    await Users.changeUserDetail(updateSql, userId, changeUserDetailsRequest);
                    res.statusMessage = 'OK';
                    res.status(200)
                        .send();
                    return;
                }catch (err) {
                    if (!err.hasBeenLogged) console.error(err);
                    res.statusMessage = 'Bad Request';
                    res.status(400)
                        .send();
                    return;
                }
            }
        }else{
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}