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
var queryUtil = require('../utils/query');
var updateUtil = require('../utils/update');

/**
 * Creates a new insert item object that can then be used to built the entire
 * request.
 *
 * @param {string}			table			The name of the table that should be queried.
 * @param {DynamoDB}		dynamodb		The dynamodb object.
 */
function InsertItem(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._table = table;
	this._params = {
		ReturnValues: 'ALL_NEW'
	};
}

/**
 * This method will initialize the request with the index query and the data query that has been provided.
 *
 * @param  {object}			query			The key of the item to insert.
 * @param  {object}			data			The insert data object.
 * @return {InsertItem}						The insert item object.
 */
InsertItem.prototype._initialize = function (query, data) {
	// Set the query as key
	this._params.Key = query;

	// Parse the data
	var parsedData = updateUtil.parse(data);

	// Append the attributes to the correct properties
	this._params.UpdateExpression = parsedData.UpdateExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedData.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedData.ExpressionAttributeValues);

	// Return the object so that it can be chained
	return this;
};

/**
 * Returns the raw result.
 *
 * @return {InsertItem}						The insert item object.
 */
InsertItem.prototype.raw = function () {
	// Set the raw parameter to true.
	this._raw = true;

	// Return the object so that it can be chained
	return this;
};

/**
 * This method will execute the insert item request that was built up.
 *
 * @return {Promise}						The promise object that resolves or rejects the promise if something went wrong.
 */
InsertItem.prototype.exec = function () {
	var db = this._dynamodb.dynamodb;
	var params = this._params;
	var raw = this._raw;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	if (params.UpdateExpression === '') {
		delete params.UpdateExpression;
	}

	// Parse the query to add a negated condition expression https://github.com/SamVerschueren/dynongo/issues/3
	var parsedQuery = queryUtil.parse(params.Key);

	params.TableName = this._table.name;
	params.ConditionExpression = 'NOT (' + parsedQuery.ConditionExpression + ')';
	params.ExpressionAttributeNames = objectAssign({}, params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	params.ExpressionAttributeValues = objectAssign({}, params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	return pify(db.update.bind(db), Promise)(params)
		.then(function (data) {
			// Return the attributes
			return raw === true ? data : data.Attributes;
		})
		.catch(function (err) {
			if (err.code === 'ConditionalCheckFailedException') {
				err.message = 'Duplicate key! A record with key `' + JSON.stringify(params.Key) + '` already exists.';
			}

			throw err;
		});
};

// Export the module
module.exports = InsertItem;
