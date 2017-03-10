'use strict';
const queryUtil = require('../utils/query');

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
 * @param  {Object}		query			The query for the index to filter on.
 * @param  {string}		[indexName]		The optional name of the global secondary index.
 * @return {BaseQuery}					The base query object.
 */
BaseQuery.prototype._initialize = function (query, indexName) {
	// Parse the query
	const parsedQuery = queryUtil.parse(query, this._params.ExpressionAttributeValues);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.KeyConditionExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = Object.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = Object.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

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
 * @param  {Object}		query			The query to filter the records on.
 * @return {BaseQuery}					The base query object.
 */
BaseQuery.prototype.where = function (query) {
	// Parse the query
	const parsedQuery = queryUtil.parse(query, this._params.ExpressionAttributeValues);

	// Add the parsed query attributes to the correct properties of the params object
	this._params.FilterExpression = parsedQuery.ConditionExpression;
	this._params.ExpressionAttributeNames = Object.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
	this._params.ExpressionAttributeValues = Object.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

	// Return the query so that it can be chained
	return this;
};

/**
 * A space or comma separated list of fields that should be returned by the query.
 *
 * @param  {string}		projection		The projection string that defines which fields should be returned.
 * @return {BaseQuery}					The base query object.
 */
BaseQuery.prototype.select = function (projection) {
	if (!projection) {
		return this;
	}

	// Convert space separated or comma separated lists to a single comma
	projection = projection.replace(/,? +/g, ',');

	// Split the projection by space
	const splittedProjection = projection.split(',');

	// Reconstruct the expression
	const expression = splittedProjection.map(p => {
		return '#k_' + p;
	}).join(', ');

	// Construct the names object
	const names = splittedProjection.reduce((result, p) => {
		result['#k_' + p] = p;

		return result;
	}, {});

	// Add the projection expression and add the list of names to the attribute names list
	this._params.ProjectionExpression = expression;
	this._params.ExpressionAttributeNames = Object.assign({}, this._params.ExpressionAttributeNames, names);

	// Return the query so that it can be chained
	return this;
};

/**
 * This method limits the number of items returned. If the limit is set to 1, the exec method
 * will return the first object instead of an array with one object.
 *
 * @param  {number}		limit			The limit of items that should be returned.
 * @return {BaseQuery}					The base query object.
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
 * @return {BaseQuery}					The base query object.
 */
BaseQuery.prototype.count = function () {
	// Set the count parameter to true.
	this._params.Select = 'COUNT';

	// Return the query so that it can be chained
	return this;
};

/**
 * Returns the raw result.
 *
 * @return {BaseQuery}					The base query object.
 */
BaseQuery.prototype.raw = function () {
	// Set the raw parameter to true.
	this._raw = true;

	// Return the query so that it can be chained
	return this;
};

// Export the base query
module.exports = BaseQuery;
