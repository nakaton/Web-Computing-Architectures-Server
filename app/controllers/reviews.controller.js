const Reviews = require('../models/reviews.model');

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