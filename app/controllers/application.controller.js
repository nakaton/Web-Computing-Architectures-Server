const Application = require('../models/application.model');

exports.getVenues = async function (req, res) {
    //res.send({ 'message': 'Hello World! venues!' })
    try {
        await Application.getVenues();
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};