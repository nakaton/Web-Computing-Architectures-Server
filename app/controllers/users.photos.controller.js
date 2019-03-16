const UsersPhotos = require('../models/users.photos.model');
const Users = require('../models/users.model');
const fs = require('mz/fs');

const photoDirectory = './storage/photos/';

/**
 * Retrieve a user's profile photo.
 */
exports.getUsersPhotoById = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');
    let path = photoDirectory;

    // //Authorise check
    // let sqlByToken = "select user_id as userId from User where auth_token = ?";
    // try{
    //     const user = await Users.getUserByToken(sqlByToken, token);
    //
    //     //User authorize check by token
    //     if(user.length <= 0){
    //         res.statusMessage = 'Unauthorized';
    //         res.status(401)
    //             .send();
    //         return;
    //     }
    // }catch (err){
    //     if (!err.hasBeenLogged) console.error(err);
    //     res.statusMessage = 'Bad Request';
    //     res.status(400)
    //         .send();
    //     return;
    // }

    // Check whether User photo is exist
    let isUserPhotoExistSql = "select profile_photo_filename as profilePhotoFilename " +
        "from User where user_id = ?"
    try{
        const result = await Users.getUserByUserId(isUserPhotoExistSql, userId);
        if(result.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            if(result[0].profilePhotoFilename == "" || result[0].profilePhotoFilename == null){
                res.statusMessage = 'Not Found';
                res.status(404)
                    .send();
                return;
            }
            //fs read photo and send response
            path = path + result[0].profilePhotoFilename; //Full path
            let contentType = "image/png";
            let fileExtension = result[0].profilePhotoFilename.split(".")[1];

            if(fileExtension != 'png'){
                contentType = "image/jpeg";
            }

            fs.readFile(path,'binary',function(err,  file)  {
                if  (err)  {
                    console.log(err);
                    return;
                }else{
                    console.log("photo file output");
                    res.statusMessage = 'OK';
                    res.writeHead(200,  {'Content-Type':contentType});
                    res.write(file,'binary');
                    res.end();
                }
            });
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}

/**
 * Set a user's profile photo.
 */
exports.setUsersPhoto = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');
    let mimeType = req.header('Content-Type'); //either image/png or image/jpeg
    let file = req.body;
    let path = photoDirectory;
    let photoFilename = '';
    let isOldPhotoExist = false;

    if(mimeType == 'image/jpeg'){
        photoFilename = 'user_' + userId + '.jpeg';
        path = path + photoFilename;
    }else{
        photoFilename = 'user_' + userId + '.png';
        path = path + photoFilename;
    }

    // Check whether user photo is exist
    let isUserExistSql = "select user_id as userId, " +
        "profile_photo_filename as profilePhotoFilename " +
        "from User where user_id = ?"
    try{
        const user = await Users.getUserByUserId(isUserExistSql, userId);
        if(user.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            if(user[0].profilePhotoFilename != null && user[0].profilePhotoFilename != ""){
                //delete physical photo in folder

                fs.unlink(photoDirectory + user[0].profilePhotoFilename, (err) => {
                    if (err) throw err;
                    console.log('old photo deleted');
                });
                isOldPhotoExist = true;
            }
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    //Authorise check
    let sqlByToken = "select user_id as userId from User where auth_token = ?";
    try{
        const userBytoken = await Users.getUserByToken(sqlByToken, token);

        //User authorize check by token
        if(userBytoken.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
            return;
        }else{
            if(userId != userBytoken[0].userId){
                res.statusMessage = 'Forbidden';
                res.status(403)
                    .send();
                return;
            }
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    let imgData=new Buffer(file,'base64');
    fs.writeFile(path,imgData,function(err)  {
        if  (err)  {
            console.log(err);
            return;
        }
    });

    let updateUserPhotoSql = "update User set profile_photo_filename = ? where user_id = ?";

    try {
        const result = await UsersPhotos.updateUserPhoto(updateUserPhotoSql, photoFilename, userId);
        if(isOldPhotoExist){
            res.statusMessage = 'OK';
            res.status(200)
                .send();
        }else{
            res.statusMessage = 'Created';
            res.status(201)
                .send();
        }
        return;

    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}

/**
 * Delete a User's profile photo.
 */
exports.deleteUsersPhoto = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');
    let path = photoDirectory;
    let profilePhotoFilename = '';

    // Check whether user photo is exist
    let isUserExistSql = "select user_id as userId, " +
        "profile_photo_filename as profilePhotoFilename " +
        "from User where user_id = ?"
    try{
        const userPhoto = await Users.getUserByUserId(isUserExistSql, userId);
        if(userPhoto.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            if(userPhoto[0].profilePhotoFilename == null || userPhoto[0].profilePhotoFilename == ""){
                res.statusMessage = 'Not Found';
                res.status(404)
                    .send();
                return;
            }else{
                profilePhotoFilename = userPhoto[0].profilePhotoFilename;
            }
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    //Authorise check
    let sqlByToken = "select user_id as userId from User where auth_token = ?";
    try{
        const user = await Users.getUserByToken(sqlByToken, token);

        //User authorize check by token
        if(user.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
            return;
        }else{
            if(userId != user[0].userId){
                res.statusMessage = 'Forbidden';
                res.status(403)
                    .send();
                return;
            }
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    //delete User photo
    let deleteUserPhotoSql = "update User set profile_photo_filename = ? where user_id = ?";
    try {
        const result = await UsersPhotos.updateUserPhoto(deleteUserPhotoSql, null, userId);

        //delete physical photo in folder
        path = path + profilePhotoFilename; //Full path

        fs.unlink(path, (err) => {
            if (err) throw err;
            console.log('photo deleted');
            res.statusMessage = 'OK';
            res.status(200)
                .send();
            getUsersPhotoById;
        });
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}