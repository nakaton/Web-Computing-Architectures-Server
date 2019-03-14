const db = require('../../config/db');

/*
* Function 'updateUserPhoto' for update user photo profile
*/
exports.updateUserPhoto = async function (sql, photoFilename, userId) {
    try {
        let values = [photoFilename, userId];
        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}