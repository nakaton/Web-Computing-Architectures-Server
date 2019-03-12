const db = require('../../config/db');

/*
* Model 'Review' for View review info
*/
exports.Review = function Review(review) {
    this.reviewAuthor = review.reviewAuthor;
    this.reviewBody = review.reviewBody;
    this.starRating = review.starRating;
    this.costRating = review.costRating;
    this.timePosted = review.timePosted;
}

/*
* Model 'ReviewAuthor' for View Review Author
*/
exports.ReviewAuthor = function ReviewAuthor(reviewAuthor) {
    this.userId = reviewAuthor.userId;
    this.username = reviewAuthor.username;
}

/*
* Function 'getLatestReview' for Retrieves a venue's reviews.
*/
exports.getLatestReview = async function (sql, venueId) {
    try {
        let values = [venueId];

        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}