const application = require('../controllers/application.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/venues')
        .get(application.getVenues);
};
