'use strict';

/**
 * This class forms the builder pattern for removing an item.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  18 Jul. 2015
 */

// module dependencies
var Promise = require('pinkie-promise');
var pify = require('pify');
var objectAssign = require('object-assign');

// utility
var queryUtil = require('../utils/query');
var tableUtil = require('../utils/table');

/**
 * Creates a new delete item object that can then be used to built the entire
 * request.
 *
 * @param {string}		table			The name of the table that should be queried.
 * @param {DynamoDB}	dynamodb		The dynamodb object.
 */
function DeleteItem(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._table = table;
	this._params = {};
}

/**
 * This method will initialize the request with the index query that has been provided.
 *
 * @param  {object}		query			The query for the index to filter on.
 * @return {DeleteItem}					The delete item object.
 */
DeleteItem.prototype._initialize = function (query) {
	// Set the query as key
	this._params.Key = query;

	// Return the object so that it can be chained
	return this;
};

/**
 * This will create a conditional delete item object where the condition should be satisfied in order for the item to be
 * deleted.
 *
 * @param  {object}		condition		A condition that must be satisfied in order for a conditional DeleteItem to succeed.
 * @return {DeleteItem}					The delete item object.
 */
DeleteItem.prototype.where = function (condition) {
	// Parse the query
	var parsedQuery = queryUtil.parse(condition, this._params.ExpressionAttributeValues);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.ConditionExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the query so that it can be chained
	return this;
};

/**
 * This method will execute the delete item request that was built up.
 *
 * @return {Promise}		The promise object that resolves or rejects the promise if something went wrong.
 */
DeleteItem.prototype.exec = function () {
	var db = this._dynamodb._dynamodb;
	var params = this._params;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = tableUtil.lookupName(this._table, this._dynamodb);

	return pify(db.delete.bind(db), Promise)(params);
};

// Export the delete item
module.exports = DeleteItem;
