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
* Model 'LoginRequest' for user login
*/
exports.LoginRequest = function LoginRequest(loginRequest) {
    this.username = loginRequest.username;
    this.email = loginRequest.email;
    this.password = loginRequest.password;
}

/*
* Model 'LoginSuccessResponse' for user login response
*/
exports.LoginSuccessResponse = function LoginSuccessResponse(loginSuccessResponse) {
    this.userId = loginSuccessResponse.userId;
    this.token = loginSuccessResponse.token;
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

/*
* Function 'getUser' for Retrieve information about a user.
*/
exports.getUser = async function (sql, userId) {
    try {
        let values = [userId];

        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'isUserExist' for check whether user already exist or not.
*/
exports.isUserExist = async function (sql) {
    try {
        return await db.getPool().query(sql);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'saveToken' for save token when login successfully.
*/
exports.saveToken = async function (saveTokenSql, token, userId) {
    try {
        let values = [token,userId];

        return await db.getPool().query(saveTokenSql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};