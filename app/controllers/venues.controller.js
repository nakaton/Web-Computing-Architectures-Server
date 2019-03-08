const Venues = require('../models/venues.model');

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

    let sqlCommand = "select Venue.venue_id," +
        "Venue.venue_name," +
        "VenueCategory.category_id," +
        "Venue.city," +
        "Venue.short_description," +
        "Venue.latitude," +
        "Venue.longitude," +
        "Review.star_rating," +
        "Review.cost_rating," +
        "VenuePhoto.photo_filename " +
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
        sqlCommand += " and Review.cost_rating >=" + venueSearchRequest.maxCostRating
    }

    //Add adminId as a condition
    if(venueSearchRequest.adminId != null && venueSearchRequest.adminId != ""){
        sqlCommand += " and Venue.admin_id >=" + venueSearchRequest.adminId
    }

    //Add sortBy as a sort by sequence
    if(venueSearchRequest.sortBy == null || venueSearchRequest.sortBy == ""){
        //Sort the Venues in reverse-order.
        if(venueSearchRequest.reverseSort){
            sqlCommand += " order by star_rating DESC"
        }else{
            sqlCommand += " order by star_rating ASC"
        }
    }else{
        //Sort the Venues in reverse-order.
        if(venueSearchRequest.reverseSort){
            sqlCommand += " order by " + venueSearchRequest.sortBy + " DESC "
        }else{
            sqlCommand += " order by " + venueSearchRequest.sortBy + " ASC "
        }
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
        res.statusMessage = 'OK';
        res.status(200)
            .json(results);
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};