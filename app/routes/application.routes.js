const venues = require('../controllers/venues.controller');
const users = require('../controllers/users.controller');

module.exports = function (app) {
    //Venues
    app.route(app.rootUrl + '/venues')
        .get(venues.getVenues);
    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);

    //users
    app.route(app.rootUrl + '/users')
        .post(users.postUser);
    app.route(app.rootUrl + '/users/login')
        .post(users.login);
    app.route(app.rootUrl + '/users/:id')
        .get(users.getUser);
};
