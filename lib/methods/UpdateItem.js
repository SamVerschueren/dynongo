'use strict';

/**
 * This class forms the builder pattern for updating an item.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  19 Jul. 2015
 */

// module dependencies
var Promise = require('pinkie-promise');
var pify = require('pify');
var objectAssign = require('object-assign');

// utility
var queryUtil = require('../utils/query');
var updateUtil = require('../utils/update');

/**
 * Creates a new update item object that can then be used to built the entire
 * request.
 *
 * @param {string}		    table           The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb        The dynamodb object that should be used to query to database.
 */
function UpdateItem(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._params = {
		TableName: table,
		ReturnValues: 'ALL_NEW'
	};
}

/**
 * This method will initialize the request with the index query and the data query that has been provided.
 *
 * @param  {object}	        query           The query of the index of the item to update.
 * @param  {object}	        data            The update data object.
 * @return {DeleteItem}                     The delete item object.
 */
UpdateItem.prototype._initialize = function (query, data) {
	// Set the query as key
	this._params.Key = query;

	// Parse the update query
	var parsedUpdate = updateUtil.parse(data);

	// Append the attributes to the correct properties
	this._params.UpdateExpression = parsedUpdate.UpdateExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedUpdate.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedUpdate.ExpressionAttributeValues);

	// Return the object so that it can be chained
	return this;
};

/**
 * This will create a conditional update item object where the condition should be satisfied in order for the item to be
 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
 *
 * @param  {object}	    condition           A condition that must be satisfied in order for a conditional UpdateItem to succeed.
 * @return {DeleteItem}	                    The query object.
 */
UpdateItem.prototype._where = function (condition) {
	// Parse the query
	var parsedQuery = queryUtil.parse(condition);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.ConditionExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the object for chaining purposes
	return this;
};

/**
 * This method will execute the update item request that was built up.
 *
 * @return {Promise}                        The promise object that resolves or rejects the promise if something went wrong.
 */
UpdateItem.prototype.exec = function () {
	var dynamodb = this._dynamodb;
	var params = this._params;

	if (params.UpdateExpression === '') {
		delete params.ExpressionAttributeNames;
		delete params.ExpressionAttributeValues;
		delete params.UpdateExpression;
	}

	return pify(dynamodb.update.bind(dynamodb), Promise)(params)
		.then(function (data) {
			// Return the attributes
			return data.Attributes;
		});
};

// Export the module
module.exports = UpdateItem;
