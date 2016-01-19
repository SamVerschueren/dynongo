'use strict';

/**
 * This base query class is used as base for the Query and Scan methods.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  28 Jul. 2015
 */

// module dependencies
var objectAssign = require('object-assign');

// utility
var queryUtil = require('../utils/query');

/**
 * Creates a new query object that can then be used to built the entire
 * request.
 *
 * @param {string}		table           The name of the table that should be queried.
 * @param {DynamoDB}	dynamodb        The dynamodb object.
 */
function BaseQuery(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._table = table;
	this._params = {};
}

/**
 * This method initializes the query object.
 *
 * @param  {object} query		   The query for the index to filter on.
 * @param  {string} [indexName]	 The optional name of the global secondary index.
 * @return {Query}				  The query object.
 */
BaseQuery.prototype._initialize = function (query, indexName) {
	// Parse the query
	var parsedQuery = queryUtil.parse(query, this._params.ExpressionAttributeValues);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.KeyConditionExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	if (indexName) {
		// If the index name is provided, add it to the params object
		this._params.IndexName = indexName;
	}

	// Return the query so that it can be chained
	return this;
};

/**
 * With the `where` method you can filter the records more fine grained.
 *
 * @param  {object} query		   The query to filter the records on.
 * @return {Query}				  The query object.
 */
BaseQuery.prototype.where = function (query) {
	// Parse the query
	var parsedQuery = queryUtil.parse(query, this._params.ExpressionAttributeValues);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.FilterExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = objectAssign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the query so that it can be chained
	return this;
};

/**
 * A space or comma separated list of fields that should be returned by the query.
 *
 * @param  {string} projection	  The projection string that defines which fields should be returned.
 * @return {Query}				  The query object.
 */
BaseQuery.prototype.select = function (projection) {
	// Convert space separated or comma separated lists to a single comma
	projection = projection.replace(/,? +/g, ',');

	// Split the projection by space
	var splittedProjection = projection.split(',');

	// Reconstruct the expression
	var expression = splittedProjection.map(function (p) {
		return '#k_' + p;
	}).join(', ');

	// Construct the names object
	var names = splittedProjection.reduce(function (result, p) {
		result['#k_' + p] = p;

		return result;
	}, {});

	// Add the projection expression and add the list of names to the attribute names list
	this._params.ProjectionExpression = expression;
	this._params.ExpressionAttributeNames = objectAssign({}, this._params.ExpressionAttributeNames, names);

	// Return the query so that it can be chained
	return this;
};

/**
 * This method limits the number of items returned. If the limit is set to 1, the exec method
 * will return the first object instead of an array with one object.
 *
 * @param  {number} limit		The limit of items that should be returned.
 * @return {Query}				The query object.
 */
BaseQuery.prototype.limit = function (limit) {
	// Set the limit of returned items
	this._params.Limit = limit;

	// Return the query so that it can be chained
	return this;
};

/**
 * Returns the count of documents that would match the query.
 *
 * @return {Query}				The query object.
 */
BaseQuery.prototype.count = function () {
	// Set the count parameter to true.
	this._params.Select = 'COUNT';

	// Return the query so that it can be chained
	return this;
};

// Export the query
module.exports = BaseQuery;
