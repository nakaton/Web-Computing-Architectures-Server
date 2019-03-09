const venues = require('../controllers/venues.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/venues')
        .get(venues.getVenues);
};

module.exports = function (app) {
    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);
};
