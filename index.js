'use strict';

// Export DynamoDB
module.exports = require('./lib/DynamoDB');

// Export the table
module.exports.Table = require('./lib/Table');

// Export the methods. Should only be used for testing purposes
module.exports.methods = {
	Query: require('./lib/methods/Query'),
	Scan: require('./lib/methods/Scan'),
	InsertItem: require('./lib/methods/InsertItem'),
	UpdateItem: require('./lib/methods/UpdateItem'),
	DeleteItem: require('./lib/methods/DeleteItem'),
	DeleteTable: require('./lib/methods/DeleteTable'),
	CreateTable: require('./lib/methods/CreateTable')
};
