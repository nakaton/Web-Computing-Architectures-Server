const VenuesPhotos = require('../models/venues.photos.model');
const Users = require('../models/users.model');
const fs = require('mz/fs');

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
        }else{
            if(makePrimary == true){
                // update all other venues photo into not primary
                let sqlUpdatePrimary = "update VenuePhoto set is_primary = '0' where venue_id = ?"
                try{
                    VenuesPhotos.updatePrimary(sqlUpdatePrimary, venueId);
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
                const result = VenuesPhotos.isExistByVenueId(isPrimaryExistSql, venueId);
                if(result.length <= 0){
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

            let venuePhotoRegisterSql = "insert into VenuePhoto " +
                "(venue_id, photo_filename, photo_description, is_primary) values (?,?,?,?)"

            try{
                const insetResult = VenuesPhotos.venuePhotoRegister(venuePhotoRegisterSql,
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
    })
}