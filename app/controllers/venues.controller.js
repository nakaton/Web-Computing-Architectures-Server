const Venues = require('../models/venues.model');
const Users = require('../models/users.model');

const EARTH_RADIUS = 6378.137;

/**
 * View venues.
 */
exports.getVenues = async function (req, res) {
    //Extract query params from request into VenueSearchRequest
    let venueSearchRequest = new Venues.VenueSearchRequest(req.query);

    console.log('startIndex: ' + venueSearchRequest.startIndex);
    console.log('count: ' + venueSearchRequest.count);
    console.log('city: ' + venueSearchRequest.city);
    console.log('q: ' + venueSearchRequest.q);
    console.log('categoryId: ' + venueSearchRequest.categoryId);
    console.log('minStarRating: ' + venueSearchRequest.minStarRating);
    console.log('adminId: ' + venueSearchRequest.adminId);
    console.log('sortBy: ' + venueSearchRequest.sortBy);
    console.log('reverseSort: ' + venueSearchRequest.reverseSort);
    console.log('myLatitude: ' + venueSearchRequest.myLatitude);
    console.log('myLongitude: ' + venueSearchRequest.myLongitude);

    let sqlCommand = "select Venue.venue_id as venueId," +
        "Venue.venue_name as venueName," +
        "VenueCategory.category_id as categoryId," +
        "Venue.city as city," +
        "Venue.short_description as shortDescription," +
        "Venue.latitude as latitude," +
        "Venue.longitude as longitude," +
        "Review.star_rating as meanStarRating," +
        "Review.cost_rating as modeCostRating," +
        "VenuePhoto.photo_filename as primaryPhoto " +
        //"venue.distance" +
        "from Venue " +
        "left join VenueCategory on Venue.category_id = VenueCategory.category_id " +
        "left join Review on Venue.venue_id = Review.reviewed_venue_id " +
        "left join VenuePhoto on Venue.venue_id = VenuePhoto.venue_id " +
        "where 1=1 ";

    //Add city as a condition
    if(venueSearchRequest.city != null && venueSearchRequest.city != ""){
        sqlCommand += " and Venue.city = " + venueSearchRequest.city
    }

    //Add q as a condition
    if(venueSearchRequest.q != null && venueSearchRequest.q != ""){
        sqlCommand += " and Venue.venue_name like '%" + venueSearchRequest.q + "%'"
    }

    //Add categoryId as a condition
    if(venueSearchRequest.categoryId != null && venueSearchRequest.categoryId != ""){
        sqlCommand += " and Venue.category_id =" + venueSearchRequest.categoryId
    }

    //Add minStarRating as a condition
    if(venueSearchRequest.minStarRating != null && venueSearchRequest.minStarRating != ""){
        sqlCommand += " and Review.star_rating >=" + venueSearchRequest.minStarRating
    }

    //Add maxCostRating as a condition
    if(venueSearchRequest.maxCostRating != null && venueSearchRequest.maxCostRating != ""){
        sqlCommand += " and Review.cost_rating <=" + venueSearchRequest.maxCostRating
    }

    //Add adminId as a condition
    if(venueSearchRequest.adminId != null && venueSearchRequest.adminId != ""){
        sqlCommand += " and Venue.admin_id >=" + venueSearchRequest.adminId
    }

    // Define the starting record and number of items to include
    if (venueSearchRequest.count != null) {
        if (venueSearchRequest.startIndex != null) {
            sqlCommand += " limit " + venueSearchRequest.startIndex + "," + venueSearchRequest.count + ";";
        } else {
            sqlCommand += " limit 0," + venueSearchRequest.count + ";";
        }
    }else{
        sqlCommand += ";"
    }

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Venues.getVenues(sqlCommand);

        //The distance field only included in the results
        //when myLatitude and myLongitude parameters are provided.
        if(venueSearchRequest.myLatitude != null && venueSearchRequest.myLatitude != ""
            && venueSearchRequest.myLongitude != null && venueSearchRequest.myLongitude != ""){
            results.forEach(function (item) {
                let distance = calculateDistance(venueSearchRequest.myLatitude, venueSearchRequest.myLongitude,
                    item.latitude, item.longitude);

                item.distance = distance;
            });
        }else{
            results.forEach(function (item) {
                item.distance = "";
            });
        }

        //Sort By key columns and reverseSort
        if(venueSearchRequest.sortBy == null || venueSearchRequest.sortBy == ""){
            keySort('meanStarRating', venueSearchRequest.reverseSort);
        }else{
            let keyArr = venueSearchRequest.sortBy.split(",");
            keyArr.forEach(function (key) {
                console.log(key.trim());
                switch (key.trim()) {
                    case 'STAR_RATING':
                        results.sort(keySort('meanStarRating', venueSearchRequest.reverseSort));
                        break;
                    case 'COST_RATING':
                        results.sort(keySort('modeCostRating', venueSearchRequest.reverseSort));
                        break;
                    case 'DISTANCE':
                        results.sort(keySort('distance', venueSearchRequest.reverseSort));
                        break;
                }
            })
        }

        res.statusMessage = 'OK';
        res.status(200)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
};

/**
 * Retrieves all data about venue categories.
 */
exports.getCategories = async function (req, res) {

    let sqlCommand = "select category_id as categoryId," +
        "category_name as categoryName," +
        "category_description as categoryDescription " +
        "from VenueCategory;";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Venues.getVenues(sqlCommand);

        res.statusMessage = 'OK';
        res.status(200)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
};

/**
 * Add a new venue.
 */
exports.postVenue = async function (req, res) {
    //Extract query params from request
    let token = req.header('X-Authorization');
    let createVenueRequest = new Venues.CreateVenueRequest(req.body);

    console.log("token: " + token);

    let sqlByToken = "select user_id as userId from User where auth_token = ?";
    let sqlForVenueRegister = "insert into Venue (admin_id, " +
        "category_id, venue_name, city, " +
        "short_description, long_description, " +
        "date_added, address, latitude, longitude) " +
        "values (?,?,?,?,?,?,?,?,?,?)";

    console.log("sqlByToken: " + sqlByToken);
    console.log("sqlForVenueRegister: " + sqlForVenueRegister);

    try{
        const user = await Users.getUserByToken(sqlByToken, token);

        //User authorize check by token
        if(user.length <= 0){
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
            return;
        }else{
            const venue = await Venues.postVenue(sqlForVenueRegister, user[0].userId, createVenueRequest);
            let results = {
                "venueId": venue.insertId
            }

            res.statusMessage = 'Created';
            res.status(201)
                .json(results);
        }
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }


    let sqlCommand = "select category_id as categoryId," +
        "category_name as categoryName," +
        "category_description as categoryDescription " +
        "from VenueCategory;";

    console.log("sqlCommand: " + sqlCommand);

    try {
        const results = await Venues.getVenues(sqlCommand);

        res.statusMessage = 'OK';
        res.status(200)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
};

/**
 * Retrieve detailed information about a venue.
 */
exports.getVenueById = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let token = req.header('X-Authorization');

    console.log("venueId: " + venueId);
    console.log("token: " + token);

    let sqlForVenueDetail = "select Venue.venue_name as venueName, " +
        "User.user_id as userId, " +
        "User.username as username, " +
        "VenueCategory.category_id as categoryId, " +
        "VenueCategory.category_name as categoryName, " +
        "VenueCategory.category_description as categoryDescription, " +
        "Venue.city as city, Venue.short_description as shortDescription, " +
        "Venue.long_description as longDescription, Venue.date_added as dateAdded, " +
        "Venue.address as address, Venue.latitude as latitude, Venue.longitude as longitude, " +
        "VenuePhoto.photo_filename as photoFilename, VenuePhoto.photo_description as photoDescription, " +
        "VenuePhoto.is_primary as isPrimary " +
        "from Venue " +
        "left join User on Venue.admin_id = User.user_id " +
        "left join VenueCategory on Venue.category_id = VenueCategory.category_id " +
        "left join VenuePhoto on Venue.venue_id = VenuePhoto.venue_id " +
        "where Venue.venue_id = ?"

    console.log("sqlForVenueDetail: " + sqlForVenueDetail);

    try{
        const venueDetail = await Venues.getVenueById(sqlForVenueDetail, venueId);

        if(venueDetail.length <= 0){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }else{
            let venue = new Venues.Venue(venueDetail[0]);
            let admin = new Venues.Admin(venueDetail[0]);
            let category = new Venues.VenueCategory(venueDetail[0]);

            admin.userId = admin.userId.toString();

            venue.admin = admin;
            venue.category = category;
            venue.photos = [];

            venueDetail.forEach(function (item) {
                let photos = new Venues.VenuePhoto(item);

                if(photos.isPrimary == 0){
                    photos.isPrimary = false;
                }else{
                    photos.isPrimary = true;
                }
                venue.photos.push(photos);
            });

            res.statusMessage = 'OK';
            res.status(200)
                .json(venue);
        }
    }catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
};

/**
 * Change a venue's details.
 */
exports.patchVenueById = async function (req, res) {
    //Extract query params from request
    let venueId = req.params.id;
    let token = req.header('X-Authorization');
    let changeVenueDetailsRequest = new Venues.ChangeVenueDetailsRequest(req.body);

    console.log("venueId: " + venueId);
    console.log("token: " + token);

    let sqlByVenueId = "select admin_id as adminId from Venue where venue_id = ?";
    let sqlByToken = "select user_id as userId from User where auth_token = ?";

    console.log("sqlByVenueId: " + sqlByVenueId);
    console.log("sqlByToken: " + sqlByToken);

    try {
        const venue = await Venues.getVenueByVenueId(sqlByVenueId, venueId);
        const resultsByToken = await Users.getUserByToken(sqlByToken, token);

        if(venue.length <=0 ){
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return;
        }else{
            //Only accessible for the administrator of the venue. Otherwise return 403
            if (resultsByToken.length > 0) {
                if(resultsByToken[0].userId != venue[0].adminId){
                    res.statusMessage = 'Forbidden';
                    res.status(403)
                        .send();
                    return;
                }
            }else{
                res.statusMessage = 'Unauthorized';
                res.status(401)
                    .send();
                return;
            }
        }

        let sqlForPatchVenue = "update Venue " +
            "set venue_name = ?, " +
            "category_id = ?, " +
            "city = ?, " +
            "short_description = ?, " +
            "long_description = ?, " +
            "address = ?, " +
            "latitude = ?, " +
            "longitude = ? " +
            "where venue_id = ?";

        await Venues.patchVenue(sqlForPatchVenue, venueId, changeVenueDetailsRequest);

        res.statusMessage = 'OK';
        res.status(200)
            .send();
        return;

    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }
}

/**
* Calculate Distance between user and venue
*
* @param myLatitude: user's latitude
* @param myLongitude: user's longitude
* @param targetLatitude: venue's latitude
* @param targetLongitude: venue's longitude
*
* return distance (km)
*/
function calculateDistance(myLatitude, myLongitude, targetLatitude, targetLongitude) {
    let radLat1 = toRadians(myLatitude);
    let radLat2 = toRadians(targetLatitude);
    let a = radLat1 - radLat2;
    let b = toRadians(myLongitude) - toRadians(targetLongitude);
    let distance = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2)
        + Math.cos(radLat1) * Math.cos(radLat2)
        * Math.pow(Math.sin(b / 2), 2)));
    distance = distance * EARTH_RADIUS;
    distance = Math.round(distance * 10000) / 10000;
    return distance;
}
/**
* Translate into radians
*/
function toRadians(d) {
    return d * Math.PI / 180.0;
}

/**
 * Sort Array by key column
 * @param key
 * @param reverseSort true for "DESC"；false for "ASC"
 */
function keySort(key,reverseSort){
    return function(a,b){
        return reverseSort ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}