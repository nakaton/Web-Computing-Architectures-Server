const Reviews = require('../models/reviews.model');
const Users = require('../models/users.model');
const Venues = require('../models/venues.model');

/**
 * Retrieves a venue's reviews.
 */
exports.getLatestReview = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;

    console.log("venueId: " + venueId);

    let sqlCommand = "select User.user_id as userId, " +
        "User.username as username, " +
        "Review.review_body as reviewBody, " +
        "Review.star_rating as starRating, " +
        "Review.cost_rating as costRating, " +
        "Review.time_posted as timePosted " +
        "from Review " +
        "left join User on Review.review_author_id = User.user_id " +
        "where Review.reviewed_venue_id = ? " +
        "order by Review.time_posted DESC ";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Reviews.getLatestReview(sqlCommand, venueId);
        if (results.length > 0){

            let review = new Reviews.Review(results[0]);
            let reviewAuthor = new Reviews.ReviewAuthor(results[0]);

            review.reviewAuthor = reviewAuthor;

            console.log(review);

            res.statusMessage = 'OK';
            res.status(200)
                .json(review);
        }else{
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

/**
 * Post a review for a venue.
 */
exports.postVenueReview = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let token = req.header('X-Authorization');
    let postReviewRequest = new Reviews.PostReviewRequest(req.body);

    console.log("venueId: " + venueId);
    console.log("token: " + token);
    console.log("starRating: " + postReviewRequest.starRating);
    console.log("costRating: " + postReviewRequest.costRating);

    let sqlByToken = "select user_id as userId from User where auth_token = ?";
    let sqlByVenueId = "select admin_id as adminId from Venue where venue_id = ?";
    let sqlForReviewCount = "select count(*) as reviewCount from Review " +
        "where reviewed_venue_id = ? and review_author_id = ?";

    console.log("sqlByToken: " + sqlByToken);
    console.log("sqlByVenueId: " + sqlByVenueId);
    console.log("sqlForReviewCount: " + sqlForReviewCount);

    try{
        const user = await Users.getUserByToken(sqlByToken, token);
        const venue = await Venues.getVenueByVenueId(sqlByVenueId, venueId);

        //User authorize check by token
        if(user.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
            return;
        }

        //A user cannot review a venue they're admin of
        if(user.length > 0 && venue.length > 0){
            if(user[0].userId == venue[0].adminId){
                res.statusMessage = 'Forbidden';
                res.status(403)
                    .send();
                return;
            }
        }

        //nor a venue they have previously reviewed.
        const reviewCount = await Reviews.reviewCountByUserAndVenue(sqlForReviewCount, venueId, user[0].userId);
        if(reviewCount != null && reviewCount[0].reviewCount > 0){
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
            return;
        }

        let regexForDecimal = /^\d+\.\d+$/;

        if(postReviewRequest.starRating == null || postReviewRequest.starRating == ""
            || postReviewRequest.starRating > 5 || postReviewRequest.costRating < 0
            || regexForDecimal.test(postReviewRequest.starRating.toString())
            || regexForDecimal.test(postReviewRequest.costRating.toString())){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }

        let sqlForReviewRegister = "insert into Review (reviewed_venue_id, " +
            "review_author_id, review_body, star_rating, cost_rating, time_posted) values (?,?,?,?,?,?)";

        const result = await Reviews.addReview(sqlForReviewRegister, venueId, user[0].userId, postReviewRequest);
        res.statusMessage = 'Created';
        res.status(201)
            .send();
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}

/**
 * Retrieves all the reviews authored by a given user.
 */
exports.getAllReviewByUser = async function (req, res) {
    //Extract query params from request
    let userId = req.params.id;
    let token = req.header('X-Authorization');

    console.log("userId: " + userId);
    console.log("token: " + token);

    let sqlByToken = "select user_id as userId, username as username from User where auth_token = ?";

    console.log("sqlByToken: " + sqlByToken);

    try {
        const user = await Users.getUserByToken(sqlByToken, token);
        //User authorize check by token
        if(user.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
            return;
        }else{
            let reviewAuthor = new Reviews.ReviewAuthor(user[0]);

            let sqlReviewWithVenue = "select Review.review_body as reviewBody, " +
                "Review.star_rating as starRating, " +
                "Review.cost_rating as costRating, " +
                "Review.time_posted as timePosted, " +
                "Venue.venue_id as venueId, " +
                "Venue.venue_name as venueName, " +
                "VenueCategory.category_name as categoryName, " +
                "Venue.city as city, " +
                "Venue.short_description as shortDescription, " +
                "VenuePhoto.photo_filename as primaryPhoto " +
                "from Review " +
                "left join Venue on Review.reviewed_venue_id = Venue.venue_id " +
                "left join VenueCategory on Venue.category_id = VenueCategory.category_id " +
                "left join VenuePhoto on Review.reviewed_venue_id = VenuePhoto.venue_id " +
                "where Review.review_author_id = ?"

            const results = await Reviews.getReviewWithVenue(sqlReviewWithVenue, userId);

            if(results.length <= 0){
                res.statusMessage = 'Not Found';
                res.status(404)
                    .send();
            }else {
                let reviewWithVenueArr = [];
                results.forEach(function (item) {
                    let reviewWithVenue = new Reviews.ReviewWithVenue(item);
                    let venueBrief = new Reviews.VenueBrief(item);
                    reviewWithVenue.reviewAuthor = reviewAuthor;
                    reviewWithVenue.venue = venueBrief;

                    reviewWithVenueArr.push(reviewWithVenue);
                });

                res.statusMessage = 'OK';
                res.status(200)
                    .json(reviewWithVenueArr);
            }
        }
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
}