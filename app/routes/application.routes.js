const venues = require('../controllers/venues.controller');
const users = require('../controllers/users.controller');

//Venues
module.exports = function (app) {
    app.route(app.rootUrl + '/venues')
        .get(venues.getVenues);
};

module.exports = function (app) {
    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);
};


//users
module.exports = function (app) {
    app.route(app.rootUrl + '/users')
        .post(users.postUser);
};

// module.exports = function (app) {
//     app.route(app.rootUrl + '/users/:id')
//         .get(users.getUser);
// };
