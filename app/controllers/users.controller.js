const Users = require('../models/users.model');
const jwt = require('jsonwebtoken'); //use for create token

exports.postUser = async function (req, res) {
    //Extract query params from request into RegisterUserRequest
    let registerUserRequest = new Users.RegisterUserRequest(req.body);

    console.log("username: " + registerUserRequest.username);
    console.log("email: " + registerUserRequest.email);
    console.log("givenName: " + registerUserRequest.givenName);
    console.log("familyName: " + registerUserRequest.familyName);
    console.log("password: " + registerUserRequest.password);

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

exports.login = async function (req, res) {
    //Extract query params from request into RegisterUserRequest
    let loginRequest = new Users.LoginRequest(req.body);

    console.log("username: " + loginRequest.username);
    console.log("email: " + loginRequest.email);
    console.log("password: " + loginRequest.password);

    let sqlCommand = "select user_id as userId, " +
        "auth_token as token " +
        "from User " +
        "where password = '" + loginRequest.password +"'";

    // Password is necessity. Otherwise return 'Bad Request'
    if(loginRequest.password == null || loginRequest.password == ""){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }

    //Either username or email may be used. Otherwise return 'Bad Request'
    if (loginRequest.username != null && loginRequest.username != ""){
        sqlCommand += " and username = '" + loginRequest.username + "';"
    }else if(loginRequest.email != null && loginRequest.email != ""){
        sqlCommand += " and email = '" + loginRequest.email + "';"
    }else {
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Users.isUserExist(sqlCommand);

        // Input user doesn't exist
        if(results.length <= 0){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }else{
            //Create token
            let payload = {
                username:loginRequest.username,
                email:loginRequest.username,
                password:loginRequest.password
            }
            let token = jwt.sign(payload, 'jwt', {
                expiresIn: 60*60*1  // expire in one hour
            })
            let saveTokenSql = "update User set auth_token = ? where user_id = ?;"
            try{
                await Users.saveToken(saveTokenSql, token, results[0].userId);
                results[0].token = token;

                res.statusMessage = 'OK';
                res.status(200)
                    .json(results);
            }catch (err) {
                if (!err.hasBeenLogged) console.error(err);
                res.statusMessage = 'Bad Request';
                res.status(400)
                    .send();
            }
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

exports.getUser = async function (req, res) {
    //Extract query params from request into RegisterUserRequest
    let userId = req.params.id;

    console.log("userId: " + userId);

    let sqlCommand = "select username as username, " +
        "email as email, " +
        "given_name as givenName, " +
        "family_name as familyName from User where user_id = ?";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Users.getUser(sqlCommand, userId);
        if (results != null && results != ""){
            res.statusMessage = 'OK';
            res.status(200)
                .json(results);
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