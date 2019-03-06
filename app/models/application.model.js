const db = require('../../config/db');
const fs = require('mz/fs');

const photoDirectory = './storage/photos/';

exports.getVenues = async function () {
    let promises = [];

    promises.push({ 'message': 'Hello World! venues!' });

    return promises;
};