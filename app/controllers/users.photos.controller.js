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
    let mimeType = req.header('Content-Type'); //either image/png or image/jpeg

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
    let path = './storage/photos/';
    let photoFilename = '';

    if(mimeType == 'image/jpeg'){
        photoFilename = 'user_' + userId + '.jpeg';
        path = path + photoFilename;
    }else{
        photoFilename = 'user_' + userId + '.png';
        path = path + photoFilename;
    }

    // Check whether user is exist
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