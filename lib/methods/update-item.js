'use strict';

/**
 * This class forms the builder pattern for updating an item.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  19 Jul. 2015
 */

// module dependencies
var util = require('util');
var Promise = require('pinkie-promise');
var pify = require('pify');
var objectAssign = require('object-assign');
var queryUtil = require('../utils/query');
var tableUtil = require('../utils/table');
var InsertItem = require('./insert-item');

/**
 * Creates a new update item object that can then be used to built the entire
 * request.
 *
 * @param {string}		table			The name of the table that should be queried.
 * @param {DynamoDB}	dynamodb		The dynamodb object.
 */
function UpdateItem(table, dynamodb) {
	InsertItem.call(this, table, dynamodb);
}

// Inherit from InsertItem
util.inherits(UpdateItem, InsertItem);

/**
 * This will create a conditional update item object where the condition should be satisfied in order for the item to be
 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
 *
 * @param  {object}	    condition           A condition that must be satisfied in order for a conditional UpdateItem to succeed.
 * @return {UpdateItem}	                    The update item object.
 */
UpdateItem.prototype.where = function (condition) {
	// Parse the query
	var parsedQuery = queryUtil.parse(condition, this._params.ExpressionAttributeValues);

	if (this._params.ConditionExpression) {
		this._params.ConditionExpression = '(' + this._params.ConditionExpression + ') AND (' + parsedQuery.ConditionExpression + ')';
	} else {
		this._params.ConditionExpression = parsedQuery.ConditionExpression;
	}

	// Add the parsed query attributes to the correct properties of the params object
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the object for chaining purposes
	return this;
};

/**
 * This method will execute the update item request that was built up.
 *
 * @return {Promise}						The promise object that resolves or rejects the promise if something went wrong.
 */
UpdateItem.prototype.exec = function () {
	var db = this._dynamodb.dynamodb;
	var params = this._params;
	var raw = this._raw;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = tableUtil.lookupName(this._table, this._dynamodb);

	return pify(db.update.bind(db), Promise)(params)
		.then(function (data) {
			// Return the attributes
			return raw === true ? data : data.Attributes;
		});
};

// Export the module
module.exports = UpdateItem;
