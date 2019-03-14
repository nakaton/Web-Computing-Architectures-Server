const VenuesPhotos = require('../models/venues.photos.model');
const Users = require('../models/users.model');
const fs = require('mz/fs');

const photoDirectory = './storage/photos/';

/**
 * Add a photo to a venue.
 */
exports.postVenuesPhoto = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let description = req.body.description;
    let makePrimary = req.body.makePrimary;
    let token = req.header('X-Authorization');

    let path = req.file.path; //Include path and name
    let originalName = req.file.originalname;
    let destination = req.file.destination;
    let isPrimary = 0;
    let adminId = "";

    // Check whether Venue is exist
    let isVenueExistSql = "select admin_id as adminId from Venue where venue_id = ?"
    try{
        const result = await VenuesPhotos.isExistByVenueId(isVenueExistSql, venueId);
        if(result.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            adminId = result[0].adminId;
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
            if(adminId != user[0].userId){
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


    fs.rename(path, destination+originalName, function (err) {
        if(err) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }
    })

    if(makePrimary == true){
        // update all other venues photo into not primary
        let sqlUpdatePrimary = "update VenuePhoto set is_primary = '0' where venue_id = ?"
        try{
            await VenuesPhotos.updatePrimary(sqlUpdatePrimary, venueId);
        }catch (err){
            if (!err.hasBeenLogged) console.error(err);
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }
    }

    let isPrimaryExistSql = "select count(*) as num from VenuePhoto where is_primary = '1' and venue_id = ?"
    try{
        const result = await VenuesPhotos.isExistByVenueId(isPrimaryExistSql, venueId);
        if(result[0].num <= 0){
            makePrimary = true;
            isPrimary = 1;
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    //delete venue photo when same photoFilename already exist
    let deleteVenuePhotoSql = "delete from VenuePhoto where venue_id = ? and photo_filename = ?";
    const result = await VenuesPhotos.deleteVenuePhoto(deleteVenuePhotoSql, venueId, originalName);

    let venuePhotoRegisterSql = "insert into VenuePhoto " +
        "(venue_id, photo_filename, photo_description, is_primary) values (?,?,?,?)"

    try{
        const insetResult = await VenuesPhotos.venuePhotoRegister(venuePhotoRegisterSql,
            venueId, originalName, description, isPrimary);
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
    res.statusMessage = 'Created';
    res.status(201)
        .send();
    return;
}

/**
 * Retrieve a given photo for a venue.
 */
exports.getSpecificVenuePhoto = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let photoFilename = req.params.photoFilename;
    let token = req.header('X-Authorization');
    let path = photoDirectory;

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
        }
    }catch (err){
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    // Check whether Venue photo is exist
    let isVenuePhotoExistSql = "select venue_id as venueId, " +
        "photo_filename as photoFilename, " +
        "photo_description as photoDescription, " +
        "is_primary as isPrimary from VenuePhoto where venue_id = ? and photo_filename = ?"
    try{
        const result = await VenuesPhotos.isVenuePhotoExist(isVenuePhotoExistSql, venueId, photoFilename);
        if(result.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            //fs read photo and send response
            path = path + result[0].photoFilename; //Full path
            let contentType = "image/png";
            let fileExtension = result[0].photoFilename.split(".")[1];

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
 * Delete a venue's photo.
 */
exports.deleteSpecificVenuePhoto = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let photoFilename = req.params.photoFilename;
    let token = req.header('X-Authorization');
    let path = photoDirectory;
    let adminId = "";

    // Check whether Venue Photo is exist
    let isVenueExistSql = "select Venue.admin_id as adminId " +
        "from Venue, VenuePhoto " +
        "where Venue.venue_id = ? " +
        "and VenuePhoto.venue_id = Venue.venue_id " +
        "and VenuePhoto.photo_filename = ?"
    try{
        const result = await VenuesPhotos.isVenuePhotoExist(isVenueExistSql, venueId, photoFilename);
        if(result.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            adminId = result[0].adminId;
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
            if(adminId != user[0].userId){
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

    //delete venue photo
    let deleteVenuePhotoSql = "delete from VenuePhoto where venue_id = ? and photo_filename = ?";
    const result = await VenuesPhotos.deleteVenuePhoto(deleteVenuePhotoSql, venueId, photoFilename);

    //randomly selected one of its remaining photos to become the new primary photo
    let isVenuePhotoRemain = "select photo_filename as photoFilename from VenuePhoto where venue_id = ?"
    const venuesPhotos = await VenuesPhotos.isExistByVenueId(isVenuePhotoRemain, venueId);

    if(venuesPhotos.length > 0){
        let randomUpdatePrimarySql = "update VenuePhoto set is_primary = '1' where venue_id = ? and photo_filename = ?";
        const result = await VenuesPhotos.randomUpdatePrimary(randomUpdatePrimarySql,
            venueId, venuesPhotos[0].photoFilename);
    }

    //delete physical photo in folder
    path = path + photoFilename; //Full path

    fs.unlink(path, (err) => {
        if (err) throw err;
        console.log('photo deleted');
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    });
}

/**
 * Set a photo as the primary one for this venue.
 */
exports.setPrimary = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let photoFilename = req.params.photoFilename;
    let token = req.header('X-Authorization');
    let adminId = "";

    // Check whether Venue Photo is exist
    let isVenueExistSql = "select Venue.admin_id as adminId " +
        "from Venue, VenuePhoto " +
        "where Venue.venue_id = ? " +
        "and VenuePhoto.venue_id = Venue.venue_id " +
        "and VenuePhoto.photo_filename = ?"
    try{
        const result = await VenuesPhotos.isVenuePhotoExist(isVenueExistSql, venueId, photoFilename);
        if(result.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            adminId = result[0].adminId;
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
            if(adminId != user[0].userId){
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

    try{
        //update venue photo's primary
        let setPrimarySql = "update VenuePhoto set is_primary = '1' where venue_id = ? and photo_filename = ?";
        await VenuesPhotos.randomUpdatePrimary(setPrimarySql, venueId, photoFilename);

        //This sets isPrimary = 0 for all other photos of this venue.
        let unsetPrimarySql = "update VenuePhoto set is_primary = '0' where venue_id = ? and photo_filename <> ?";
        await VenuesPhotos.randomUpdatePrimary(unsetPrimarySql, venueId, photoFilename);

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