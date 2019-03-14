const db = require('../../config/db');

/*
* Function 'updatePrimary' for update all other photos into not primary
*/
exports.updatePrimary = function (sql, venueId) {
    try {
        return db.getPool().query(sql, venueId);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}

/*
* Function 'isExistByVenueId' for check whether data exist by venueId
*/
exports.isExistByVenueId = function (sql, venueId) {
    try {
        return db.getPool().query(sql, venueId);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}

/*
* Function 'isVenuePhotoExist' for check whether venue photo exist by venueId and photoFilename
*/
exports.isVenuePhotoExist = function (sql, venueId, photoFilename) {
    try {
        let values = [venueId, photoFilename]
        return db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}

/*
* Function 'venuePhotoRegister' for venue photo register
*/
exports.venuePhotoRegister = function (sql, venueId, originalName, description, isPrimary) {
    try {
        let values = [venueId,
            originalName,
            description,
            isPrimary];
        return db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}