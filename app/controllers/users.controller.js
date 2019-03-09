const Users = require('../models/users.model');

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