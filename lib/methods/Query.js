'use strict';

/**
 * This query class uses the builder pattern that will built up the query in multiple steps.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var util = require('util');
var Promise = require('pinkie-promise');
var pify = require('pify');

var BaseQuery = require('./BaseQuery');

// utility
var tableUtil = require('../utils/table');

/**
 * Creates a new query object that can then be used to built the entire
 * request.
 *
 * @param {string}			table		The name of the table that should be queried.
 * @param {DOC.DynamoDB}	dynamodb	The dynamodb object that should be used to query to database.
 */
function Query(table, dynamodb) {
	BaseQuery.call(this, table, dynamodb);
}

// Inherit from BaseQuery
util.inherits(Query, BaseQuery);

/**
 * Specifies the order in which to return the query results - either ascending (1) or descending (-1).
 *
 * @param  {number}			order		The order in which to return the query results.
 * @return {Query}						The query object.
 */
Query.prototype.sort = function (order) {
	if (order !== 1 && order !== -1) {
		// Set the error if the order is invalid
		this._error = new Error('Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.');
	} else {
		// Set the ScanIndexForward property
		this._params.ScanIndexForward = order === 1;
	}

	// Return the query so that it can be chained
	return this;
};

/**
 * This method will execute the query that was built to the dynamodb database.
 *
 * @return {Promise}					The promise object that resolves the data or rejects the promise if something went wrong.
 */
Query.prototype.exec = function () {
	if (this._error) {
		return Promise.reject(this._error);
	}

	var db = this._dynamodb._dynamodb;
	var params = this._params;
	var raw = this._raw;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = tableUtil.lookupName(this._table, this._dynamodb);

	return pify(db.query.bind(db), Promise)(params)
		.then(function (data) {
			if (params.Select === 'COUNT') {
				// Return the count property if Select is set to count.
				return data.Count || 0;
			}

			if (params.Limit === 1) {
				// If the limit is specifically set to 1, we should return the object instead of the array.
				if (raw === true) {
					data.Items = [data.Items[0]];
					return data;
				}

				return data.Items[0];
			}

			// Return all the items
			return raw === true ? data : data.Items;
		});
};

// Export the query
module.exports = Query;
