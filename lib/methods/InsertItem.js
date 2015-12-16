'use strict';

/**
 * This class forms the builder pattern for inserting an item.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  16 Dec. 2015
 */

// module dependencies
var Promise = require('pinkie-promise');
var pify = require('pify');
var objectAssign = require('object-assign');

// utility
var updateUtil = require('../utils/update');

/**
 * Creates a new insert item object that can then be used to built the entire
 * request.
 *
 * @param {string}		    table           The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb        The dynamodb object that should be used to query to database.
 */
function InsertItem(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._params = {
		TableName: table,
		ReturnValues: 'ALL_NEW'
	};
}

/**
 * This method will initialize the request with the index query and the data query that has been provided.
 *
 * @param  {object}	        query           The key of the item to insert.
 * @param  {object}	        data            The insert data object.
 * @return {DeleteItem}                     The delete item object.
 */
InsertItem.prototype._initialize = function (query, data) {
	// Set the query as key
	this._params.Key = query;

	// Parse the query
	var parsedUpdate = updateUtil.parse(data);

	// Append the attributes to the correct properties
	this._params.UpdateExpression = parsedUpdate.UpdateExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedUpdate.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedUpdate.ExpressionAttributeValues);

	// Return the object so that it can be chained
	return this;
};

/**
 * This method will execute the insert item request that was built up.
 *
 * @return {Promise}                        The promise object that resolves or rejects the promise if something went wrong.
 */
InsertItem.prototype.exec = function () {
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
module.exports = InsertItem;
