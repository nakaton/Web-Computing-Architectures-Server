const venues = require('../controllers/venues.controller');
const users = require('../controllers/users.controller');
const review = require('../controllers/reviews.controller');
const usersPhotos = require('../controllers/users.photos.controller');
const venuesPhotos = require('../controllers/venues.photos.controller');

module.exports = function (app) {
    //Venues
    app.route(app.rootUrl + '/venues')
        .get(venues.getVenues);
    app.route(app.rootUrl + '/venues')
        .post(venues.postVenue);
    app.route(app.rootUrl + '/venues/:id')
        .get(venues.getVenueById);
    app.route(app.rootUrl + '/venues/:id')
        .patch(venues.patchVenueById);
    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);

    //Review
    app.route(app.rootUrl + '/venues/:id/reviews')
        .get(review.getLatestReview);
    app.route(app.rootUrl + '/venues/:id/reviews')
        .post(review.postVenueReview);
    app.route(app.rootUrl + '/users/:id/reviews')
        .get(review.getAllReviewByUser);

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

    //Users.Photos
    app.route(app.rootUrl + '/users/:id/photo')
        .get(usersPhotos.getUsersPhotoById);
    app.route(app.rootUrl + '/users/:id/photo')
        .put(usersPhotos.setUsersPhoto);

    //Venues.Photos
    app.route(app.rootUrl + '/venues/:id/photos')
        .post(venuesPhotos.postVenuesPhoto);
    app.route(app.rootUrl + '/venues/:id/photos/:photoFilename')
        .get(venuesPhotos.getSpecificVenuePhoto);

};
