const db = require('../../config/db');
const fs = require('mz/fs');

/*
* Model 'VenueSearchRequest' for View venues request
*/
exports.VenueSearchRequest = function VenueSearchRequest(venueSearchRequest) {
    this.startIndex = venueSearchRequest.startIndex;
    this.count = venueSearchRequest.count;
    this.city = venueSearchRequest.city;
    this.q = venueSearchRequest.q;
    this.categoryId = venueSearchRequest.categoryId;
    this.minStarRating = venueSearchRequest.minStarRating;
    this.maxCostRating = venueSearchRequest.maxCostRating;
    this.adminId = venueSearchRequest.adminId;
    this.sortBy = venueSearchRequest.sortBy;
    this.reverseSort = venueSearchRequest.reverseSort;
    this.myLatitude = venueSearchRequest.myLatitude;
    this.myLongitude = venueSearchRequest.myLongitude;
    this.myLongitude = venueSearchRequest.myLongitude;
}

/*
* Model 'VenueOverview' for View venues
*/
exports.VenueOverview = function VenueOverview(venueOverview){
    this.venueId = venueOverview.venueId;
    this.venueName = venueOverview.venueName;
    this.categoryId = venueOverview.categoryId;
    this.city = venueOverview.city;
    this.shortDescription = venueOverview.shortDescription;
    this.latitude = venueOverview.latitude;
    this.longitude = venueOverview.longitude;
    this.meanStarRating = venueOverview.meanStarRating;
    this.modeCostRating = venueOverview.modeCostRating;
    this.primaryPhoto = venueOverview.primaryPhoto;
    this.distance = venueOverview.distance;
}

/*
* Model 'CreateVenueRequest' for Add a new venue.
*/
exports.CreateVenueRequest = function CreateVenueRequest(createVenueRequest){
    this.venueName = createVenueRequest.venueName;
    this.categoryId = createVenueRequest.categoryId;
    this.city = createVenueRequest.city;
    this.shortDescription = createVenueRequest.shortDescription;
    this.longDescription = createVenueRequest.longDescription;
    this.address = createVenueRequest.address;
    this.latitude = createVenueRequest.latitude;
    this.longitude = createVenueRequest.longitude;
}

/*
* Model 'Venue' for Retrieve detailed information about a venue.
*/
exports.Venue = function Venue(venue){
    this.venueName = venue.venueName;
    this.admin = venue.admin;
    this.category = venue.category;
    this.city = venue.city;
    this.shortDescription = venue.shortDescription;
    this.longDescription = venue.longDescription;
    this.dateAdded = venue.dateAdded;
    this.address = venue.address;
    this.latitude = venue.latitude;
    this.longitude = venue.longitude;
    this.photos = venue.photos;
}

/*
* Model 'Admin' for Venue admin info.
*/
exports.Admin = function Admin(admin){
    this.userId = admin.userId;
    this.username = admin.username;
}

/*
* Model 'VenuePhoto' for Venue photo info.
*/
exports.VenuePhoto = function Admin(venuePhoto){
    this.photoFilename = venuePhoto.photoFilename;
    this.photoDescription = venuePhoto.photoDescription;
    this.isPrimary = venuePhoto.isPrimary;
}

/*
* Model 'ChangeVenueDetailsRequest' for Change a venue's details.
*/
exports.ChangeVenueDetailsRequest = function ChangeVenueDetailsRequest(changeVenueDetailsRequest){
    this.venueName = changeVenueDetailsRequest.venueName;
    this.categoryId = changeVenueDetailsRequest.categoryId;
    this.city = changeVenueDetailsRequest.city;
    this.shortDescription = changeVenueDetailsRequest.shortDescription;
    this.longDescription = changeVenueDetailsRequest.longDescription;
    this.address = changeVenueDetailsRequest.address;
    this.latitude = changeVenueDetailsRequest.latitude;
    this.longitude = changeVenueDetailsRequest.longitude;
}

/*
* Model 'VenueCategory' for Venue category detail.
*/
exports.VenueCategory = function VenueCategory(venueCategory){
    this.categoryId = venueCategory.categoryId;
    this.categoryName = venueCategory.categoryName;
    this.categoryDescription = venueCategory.categoryDescription;
}

/*
* Function 'getVenues' for View venues
*/
exports.getVenues = async function (sql) {
    try {
        return await db.getPool().query(sql);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'getVenueByVenueId' for View venue by venue id
*/
exports.getVenueByVenueId = async function (sql, venueId) {
    try {
        return await db.getPool().query(sql, venueId);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'getCategories' for View venues
*/
exports.getCategories = async function (sql) {
    try {
        return await db.getPool().query(sql);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'postVenue' for Add venues
*/
exports.postVenue = async function (sql, userId, createVenueRequest) {
    try {
        let postDate = new Date();
        let values = [userId,
            createVenueRequest.categoryId,
            createVenueRequest.venueName,
            createVenueRequest.city,
            createVenueRequest.shortDescription,
            createVenueRequest.longDescription,
            postDate,
            createVenueRequest.address,
            createVenueRequest.latitude,
            createVenueRequest.longitude
        ];
        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};

/*
* Function 'getVenueById' for retrieve venues detail
*/
exports.getVenueById = async function (sql, venueId) {
    try {
        let values = [venueId];
        return await db.getPool().query(sql, values);
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
};