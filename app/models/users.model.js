const db = require('../../config/db');
const fs = require('mz/fs');

/*
* Model 'RegisterUserRequest' for View venues request
*/
exports.RegisterUserRequest = function RegisterUserRequest(registerUserRequest) {
    this.username = registerUserRequest.username;
    this.email = registerUserRequest.email;
    this.givenName = registerUserRequest.givenName;
    this.familyName = registerUserRequest.familyName;
    this.password = registerUserRequest.password;
}

/*
* Function 'postUser' for Register as a new user.
*/
exports.postUser = async function (sql, registerUserRequest) {
    try {
        let values = [registerUserRequest.username,
                      registerUserRequest.email,
                      registerUserRequest.givenName,
                      registerUserRequest.familyName,
                      registerUserRequest.password]

        let result = await db.getPool().query(sql, values);
        return {"userId": result.insertId};
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};