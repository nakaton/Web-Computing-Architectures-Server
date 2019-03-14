const UsersPhotos = require('../models/users.photos.model');

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

    let body = '';

    // 创建一个长度为 10、且用 0 填充的 Buffer。
    // const buf1 = Buffer.alloc(10);


}