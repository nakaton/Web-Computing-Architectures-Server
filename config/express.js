const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');

const photoDirectory = './storage/photos/';

const allowCrossOriginRequests = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT');
    next();
};

module.exports = function () {
    const app = express();
    app.rootUrl = '/api/v1';

    // MIDDLEWARE
    app.use(allowCrossOriginRequests);
    app.use(bodyParser.json());
    app.use(bodyParser.raw({ type: 'text/plain' }));  // for the /executeSql endpoint
    app.use(bodyParser.raw({ type: 'image/jpeg', limit: '50mb' }));  // for image/jpeg
    app.use(bodyParser.raw({ type: 'image/png', limit: '50mb' }));  // for image/png
    app.use(multer({dest:photoDirectory}).single('photo'));

    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/application.routes')(app); // Route for functional api - yya125

    // DEBUG (you can remove this)
    app.get('/', function (req, res) {
        res.send({ 'message': 'Hello World!' })
    });

    return app;
};
