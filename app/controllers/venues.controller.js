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
    console.log('maxCostRating: ' + venueSearchRequest.maxCostRating);
    console.log('adminId: ' + venueSearchRequest.adminId);
    console.log('sortBy: ' + venueSearchRequest.sortBy);
    console.log('reverseSort: ' + venueSearchRequest.reverseSort);
    console.log('myLatitude: ' + venueSearchRequest.myLatitude);
    console.log('myLongitude: ' + venueSearchRequest.myLongitude);

    if((venueSearchRequest.minStarRating != undefined && venueSearchRequest.minStarRating > 5)
        || (venueSearchRequest.maxCostRating != undefined && venueSearchRequest.maxCostRating < 0)){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    //Sorting by distance should return a 400 if the myLatitude and myLongitude parameters are not provided.
    if(venueSearchRequest.sortBy == "DISTANCE"){
        if(venueSearchRequest.myLatitude == undefined
            || venueSearchRequest.myLatitude == null
            || venueSearchRequest.myLatitude == ""
            || venueSearchRequest.myLongitude == undefined
            || venueSearchRequest.myLongitude == null
            || venueSearchRequest.myLongitude == ""){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }
    }

    let sqlCommand = "select Venue.venue_id as venueId," +
        "Venue.venue_name as venueName," +
        "VenueCategory.category_id as categoryId," +
        "Venue.city as city," +
        "Venue.short_description as shortDescription," +
        "Venue.latitude as latitude," +
        "Venue.longitude as longitude," +
        "Review.star_rating as starRating," +
        "Review.cost_rating as costRating," +
        "VenuePhoto.photo_filename as primaryPhoto " +
        "from Venue " +
        "left join VenueCategory on Venue.category_id = VenueCategory.category_id " +
        "left join Review on Venue.venue_id = Review.reviewed_venue_id " +
        "left join VenuePhoto on Venue.venue_id = VenuePhoto.venue_id and VenuePhoto.is_primary = '1' " +
        "where 1=1 ";

    //Add city as a condition
    if(venueSearchRequest.city != undefined && venueSearchRequest.city != null && venueSearchRequest.city != ""){
        sqlCommand += " and Venue.city = '" + venueSearchRequest.city + "'"
    }

    //Add q as a condition
    if(venueSearchRequest.q != undefined && venueSearchRequest.q != null && venueSearchRequest.q != ""){
        sqlCommand += " and Venue.venue_name like '%" + venueSearchRequest.q + "%'"
    }

    //Add categoryId as a condition
    if(venueSearchRequest.categoryId != undefined && venueSearchRequest.categoryId != null && venueSearchRequest.categoryId != ""){
        sqlCommand += " and Venue.category_id = " + venueSearchRequest.categoryId
    }

    //Add adminId as a condition
    if(venueSearchRequest.adminId != undefined && venueSearchRequest.adminId != null && venueSearchRequest.adminId != ""){
        sqlCommand += " and Venue.admin_id = " + venueSearchRequest.adminId
    }

    sqlCommand += " order by venueId, " +
        "venueName, " +
        "categoryId, " +
        "city, " +
        "shortDescription, " +
        "latitude, " +
        "longitude, " +
        "primaryPhoto "

    console.log("sqlCommand: " + sqlCommand);

    try {
        let results = await Venues.getVenues(sqlCommand);

        //When venueId is null, delete the item
        for(let i = 0; i < results.length; i++) {
            if(results[i].venueId == null) {
                results.splice(i, 1);
            }
        }

        if(results.length > 0){
            //Calculate meanStarRating and modeStarRating
            let previousItem = results[0];
            let totalStarRating = 0;
            let meanStarRating = null;
            let modeCostRating = null;
            let costRatingArr = [];
            let stepResult = [];

            results.forEach(function (item) {
                if(previousItem.venueId == item.venueId){
                    totalStarRating += item.starRating;
                    costRatingArr.push(item.costRating);
                    previousItem = item;
                }else{
                    if(costRatingArr.length > 0 && costRatingArr[0] != null){
                        meanStarRating = Math.round(totalStarRating / costRatingArr.length * 10000) / 10000;
                    }else{
                        meanStarRating = 3;
                    }
                    modeCostRating = modeCalculation(costRatingArr);
                    let venue = {
                        "venueId":previousItem.venueId,
                        "venueName":previousItem.venueName,
                        "categoryId":previousItem.categoryId,
                        "city":previousItem.city,
                        "shortDescription":previousItem.shortDescription,
                        "latitude":previousItem.latitude,
                        "longitude":previousItem.longitude,
                        "meanStarRating":meanStarRating,
                        "modeCostRating":modeCostRating,
                        "primaryPhoto":previousItem.primaryPhoto,
                        "distance":previousItem.distance
                    }

                    totalStarRating = item.starRating;
                    meanStarRating = null;
                    modeCostRating = null;
                    costRatingArr = [];
                    costRatingArr.push(item.costRating);
                    previousItem = item;
                    stepResult.push(venue);
                }
            })

            //Add in the last Venue
            if(costRatingArr.length > 0 && costRatingArr[0] != null){
                meanStarRating = Math.round(totalStarRating / costRatingArr.length * 10000) / 10000;
            }else{
                meanStarRating = 3;
            }
            modeCostRating = modeCalculation(costRatingArr);
            let venue = {
                "venueId":previousItem.venueId,
                "venueName":previousItem.venueName,
                "categoryId":previousItem.categoryId,
                "city":previousItem.city,
                "shortDescription":previousItem.shortDescription,
                "latitude":previousItem.latitude,
                "longitude":previousItem.longitude,
                "meanStarRating":meanStarRating,
                "modeCostRating":modeCostRating,
                "primaryPhoto":previousItem.primaryPhoto,
                "distance":previousItem.distance
            }
            stepResult.push(venue);

            //Only include Venues that have an average (mean) star rating >= minStarRating.
            let starFilterResult = [];
            if(venueSearchRequest.minStarRating != undefined
                && venueSearchRequest.minStarRating != null
                && venueSearchRequest.minStarRating != ""){
                for(let i = 0; i < stepResult.length; i++) {
                    if(stepResult[i].meanStarRating != null && stepResult[i].meanStarRating != ""
                        && stepResult[i].meanStarRating < venueSearchRequest.minStarRating) {

                    }else{
                        starFilterResult.push(stepResult[i])
                    }
                }
                stepResult = starFilterResult;
            }

            //Only include Venues that have an average (mode) cost rating <= maxCostRating.
            let costFilterResult = [];
            if(venueSearchRequest.maxCostRating != undefined
                && venueSearchRequest.maxCostRating != null
                && venueSearchRequest.maxCostRating != ""){
                for(let i = 0; i < stepResult.length; i++) {
                    if(stepResult[i].modeCostRating != null && stepResult[i].modeCostRating != ""
                        && stepResult[i].modeCostRating > venueSearchRequest.maxCostRating) {

                    }else{
                        costFilterResult.push(stepResult[i])
                    }
                }
                stepResult = costFilterResult;
            }

            //The distance field only included in the results
            //when myLatitude and myLongitude parameters are provided.
            if(venueSearchRequest.myLatitude != undefined
                && venueSearchRequest.myLatitude != null
                && venueSearchRequest.myLatitude != ""
                && venueSearchRequest.myLongitude != undefined
                && venueSearchRequest.myLongitude != null
                && venueSearchRequest.myLongitude != ""){
                stepResult.forEach(function (item) {
                    let distance = calculateDistance(venueSearchRequest.myLatitude, venueSearchRequest.myLongitude,
                        item.latitude, item.longitude);

                    item.distance = distance;
                });
            }

            if(venueSearchRequest.reverseSort == undefined || venueSearchRequest.reverseSort == null || venueSearchRequest.reverseSort == ""){
                venueSearchRequest.reverseSort = false;
            }else{
                if(venueSearchRequest.reverseSort == "false"){
                    venueSearchRequest.reverseSort = false;
                }
                if(venueSearchRequest.reverseSort == "true"){
                    venueSearchRequest.reverseSort = true;
                }
            }

            //Sort By key columns and reverseSort
            if(venueSearchRequest.sortBy == undefined
                || venueSearchRequest.sortBy == null
                || venueSearchRequest.sortBy == ""){
                stepResult.sort(keySort('meanStarRating', venueSearchRequest.reverseSort));
            }else{
                let keyArr = venueSearchRequest.sortBy.split(",");
                keyArr.forEach(function (key) {
                    console.log(key.trim());
                    switch (key.trim()) {
                        case 'STAR_RATING':
                            stepResult.sort(keySort('meanStarRating', venueSearchRequest.reverseSort));
                            break;
                        case 'COST_RATING':
                            stepResult.sort(keySort('modeCostRating', venueSearchRequest.reverseSort));
                            break;
                        case 'DISTANCE':
                            stepResult.sort(keySort('distance', venueSearchRequest.reverseSort));
                            break;
                    }
                })
            }

            // Define the starting record and number of items to include
            if(venueSearchRequest.startIndex == undefined || venueSearchRequest.startIndex == null || venueSearchRequest.startIndex == "") {
                venueSearchRequest.startIndex = 0;
            }
            if (venueSearchRequest.count == undefined || venueSearchRequest.count == null || venueSearchRequest.count == "") {
                venueSearchRequest.count = results.length - venueSearchRequest.startIndex;
            }

            let finalResults = [];
            for(let i = venueSearchRequest.startIndex,j = 1 ; j <= venueSearchRequest.count && i < stepResult.length; i++, j++) {
                finalResults.push(stepResult[i]);
            }

            res.statusMessage = 'OK';
            res.status(200)
                .json(finalResults);
        }else{
            res.statusMessage = 'OK';
            res.status(200)
                .json(results);
        }
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

    if(createVenueRequest.latitude > 90.0 || createVenueRequest.longitude < -180.0){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return
    }

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

    // VenueId is required
    if(venueId == undefined){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

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
                if(photos.photoFilename != undefined && photos.photoFilename != null && photos.photoFilename != ""){
                    venue.photos.push(photos);
                }
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
    let isDifferent = false

    console.log("venueId: " + venueId);
    console.log("token: " + token);

    // VenueId is required
    if(venueId == undefined){
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
        return;
    }

    let sqlByVenueId = "select admin_id as adminId," +
        "category_id as categoryId," +
        "venue_name as venueName," +
        "city as city," +
        "short_description as shortDescription," +
        "long_description as longDescription," +
        "address as address," +
        "latitude as latitude," +
        "longitude as longitude from Venue where venue_id = ?";
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

        let values = [];
        let sqlForPatchVenue = "update Venue set venue_name = ? ";

        if(changeVenueDetailsRequest.venueName != undefined && venue[0].venueName != changeVenueDetailsRequest.venueName){
            values.push(changeVenueDetailsRequest.venueName)
            isDifferent = true
        }else{
            values.push(venue[0].venueName)
        }

        if(changeVenueDetailsRequest.categoryId != undefined && venue[0].categoryId != changeVenueDetailsRequest.categoryId){
            sqlForPatchVenue += ", category_id = ? "
            values.push(changeVenueDetailsRequest.categoryId)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.city != undefined && venue[0].city != changeVenueDetailsRequest.city){
            sqlForPatchVenue += ", city = ? "
            values.push(changeVenueDetailsRequest.city)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.shortDescription != undefined && venue[0].shortDescription != changeVenueDetailsRequest.shortDescription){
            sqlForPatchVenue += ", short_description = ? "
            values.push(changeVenueDetailsRequest.shortDescription)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.longDescription != undefined && venue[0].longDescription != changeVenueDetailsRequest.longDescription){
            sqlForPatchVenue += ", long_description = ? "
            values.push(changeVenueDetailsRequest.longDescription)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.address != undefined && venue[0].address != changeVenueDetailsRequest.address){
            sqlForPatchVenue += ", address = ? "
            values.push(changeVenueDetailsRequest.address)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.latitude != undefined && venue[0].latitude != changeVenueDetailsRequest.latitude){
            sqlForPatchVenue += ", latitude = ? "
            values.push(changeVenueDetailsRequest.latitude)
            isDifferent = true
        }

        if(changeVenueDetailsRequest.longitude != undefined && venue[0].longitude != changeVenueDetailsRequest.longitude){
            sqlForPatchVenue += ", longitude = ? "
            values.push(changeVenueDetailsRequest.longitude)
            isDifferent = true
        }

        sqlForPatchVenue += "where venue_id = ?"
        values.push(venueId)

        if(!isDifferent){
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
            return;
        }

        console.log("sqlForPatchVenue: " + sqlForPatchVenue)

        await Venues.patchVenue(sqlForPatchVenue, values);

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
        return reverseSort ? (a[key] - b[key]) : (b[key] - a[key]);
    }
}

/**
 * Mode Calculation
 * @param costRatingArr
 * return value
 */
function modeCalculation(costRatingArr){
    let map = new Map();
    costRatingArr.forEach(function (item) {
        if(map.get(item)){
            map.set(item, map.get(item) + 1);
        }else{
            map.set(item, 1);
        }
    })

    let maxCount = 0;
    let modeValue = null;
    map.forEach(function (item, key) {
        if(item > maxCount){
            maxCount = item;
            modeValue = key;
        }
        if(item = maxCount && key > modeValue){
            modeValue = key;
        }
    })

    return modeValue;
}