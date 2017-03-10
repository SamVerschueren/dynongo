'use strict';
const util = require('util');
const pify = require('pify');
const queryUtil = require('../utils/query');
const InsertItem = require('./insert-item');

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
	const parsedQuery = queryUtil.parse(condition, this._params.ExpressionAttributeValues);

	if (this._params.ConditionExpression) {
		this._params.ConditionExpression = '(' + this._params.ConditionExpression + ') AND (' + parsedQuery.ConditionExpression + ')';
	} else {
		this._params.ConditionExpression = parsedQuery.ConditionExpression;
	}

	// Add the parsed query attributes to the correct properties of the params object
	this._params.ExpressionAttributeNames = Object.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = Object.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the object for chaining purposes
	return this;
};

/**
 * This method will execute the update item request that was built up.
 *
 * @return {Promise}						The promise object that resolves or rejects the promise if something went wrong.
 */
UpdateItem.prototype.exec = function () {
	const db = this._dynamodb.dynamodb;
	const params = this._params;
	const raw = this._raw;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = this._table.name;

	return pify(db.update.bind(db), Promise)(params)
		.then(data => {
			// Return the attributes
			return raw === true ? data : data.Attributes;
		});
};

// Export the module
module.exports = UpdateItem;
