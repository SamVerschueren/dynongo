'use strict';

// Export DynamoDB
module.exports = require('./lib/dynamodb');

// Export the table
module.exports.Table = require('./lib/table');

// Export the methods. Should only be used for testing purposes
module.exports.methods = {
	Query: require('./lib/methods/query'),
	Scan: require('./lib/methods/scan'),
	InsertItem: require('./lib/methods/insert-item'),
	UpdateItem: require('./lib/methods/update-item'),
	DeleteItem: require('./lib/methods/delete-item'),
	DeleteTable: require('./lib/methods/delete-table'),
	CreateTable: require('./lib/methods/create-table')
};
