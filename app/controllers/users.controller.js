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

        res.statusMessage = 'OK';
        res.status(201)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}