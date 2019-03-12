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
* Model 'PostReviewRequest' for Venue Review Request
*/
exports.PostReviewRequest = function PostReviewRequest(postReviewRequest) {
    this.reviewBody = postReviewRequest.reviewBody;
    this.starRating = postReviewRequest.starRating;
    this.costRating = postReviewRequest.costRating;
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

/*
* Function 'reviewCountByUserAndVenue' for count review number by specific user and venue.
*/
exports.reviewCountByUserAndVenue = async function (sql, venueId, userId) {
    try {
        let values = [venueId, userId];

        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}

/*
* Function 'addReview' for Post a review for a venue.
*/
exports.addReview = async function (sql, venueId, userId, postReviewRequest) {
    try {
        let postDate = new Date();
        let values = [venueId,
            userId,
            postReviewRequest.reviewBody,
            postReviewRequest.starRating,
            postReviewRequest.costRating,
            postDate];

        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}