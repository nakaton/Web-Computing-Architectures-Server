const venues = require('../controllers/venues.controller');
const users = require('../controllers/users.controller');
const review = require('../controllers/reviews.controller');

module.exports = function (app) {
    //Venues
    app.route(app.rootUrl + '/venues')
        .get(venues.getVenues);
    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);

    //Review
    app.route(app.rootUrl + '/venues/:id/reviews')
        .get(review.getLatestReview);
    app.route(app.rootUrl + '/venues/:id/reviews')
        .post(review.postVenueReview);

    //Users
    app.route(app.rootUrl + '/users')
        .post(users.postUser);
    app.route(app.rootUrl + '/users/login')
        .post(users.login);
    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);
    app.route(app.rootUrl + '/users/:id')
        .get(users.getUser);
    app.route(app.rootUrl + '/users/:id')
        .patch(users.patchUser);
};
