'use strict';

// Export DynamoDB
module.exports = require('./lib/DynamoDB');

// Export the table
module.exports.Table = require('./lib/Table');

// Export the methods. Should only be used for testing purposes
module.exports.methods = {
    Query: require('./lib/methods/Query'),
    Scan: require('./lib/methods/Scan'),
    UpdateItem: require('./lib/methods/UpdateItem'),
    DeleteItem: require('./lib/methods/DeleteItem')
};