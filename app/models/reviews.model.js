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
* Model 'ReviewWithVenue' for Review with Venue
*/
exports.ReviewWithVenue = function ReviewWithVenue(reviewWithVenue) {
    this.reviewAuthor = reviewWithVenue.reviewAuthor;
    this.reviewBody = reviewWithVenue.reviewBody;
    this.starRating = reviewWithVenue.starRating;
    this.costRating = reviewWithVenue.costRating;
    this.timePosted = reviewWithVenue.timePosted;
    this.venue = reviewWithVenue.venue;
}

/*
* Model 'VenueBrief' for Venue Brief
*/
exports.VenueBrief = function VenueBrief(venueBrief) {
    this.venueId = venueBrief.venueId;
    this.venueName = venueBrief.venueName;
    this.categoryName = venueBrief.categoryName;
    this.city = venueBrief.city;
    this.shortDescription = venueBrief.shortDescription;
    this.primaryPhoto = venueBrief.primaryPhoto;
}

/*
* Function 'getReviewsByVenueId' for Retrieves a venue's reviews.
*/
exports.getReviewsByVenueId = async function (sql, venueId) {
    try {
        let values = [venueId];

        const reviews =  await db.getPool().query(sql, values);
        return reviews.map(review => ({
            'reviewAuthor': {
                'userId': review.userId,
                'username': review.username
            },
            'reviewBody': review.reviewBody,
            'starRating': review.starRating,
            'costRating': review.costRating,
            'timePosted': review.timePosted
        }));
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

/*
* Function 'getReviewWithVenue' for Retrieves all the reviews authored by a given user.
*/
exports.getReviewWithVenue = async function (sql, userId) {
    try {
        let values = [userId];

        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}