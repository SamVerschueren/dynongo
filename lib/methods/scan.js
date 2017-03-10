'use strict';
const util = require('util');
const pify = require('pify');
const BaseQuery = require('./base-query');

/**
 * Creates a new scan object that can then be used to built the entire
 * request.
 *
 * @param {string}		    table		The name of the table that should be queried.
 * @param {DOC.DynamoDB}	dynamodb	The dynamodb object that should be used to scan to database.
 */
function Scan(table, dynamodb) {
	BaseQuery.call(this, table, dynamodb);
}

// Inherit from BaseQuery
util.inherits(Scan, BaseQuery);

/**
 * This method will execute the scan that was built to the dynamodb database.
 *
 * @return {Promise}					The promise object that resolves the data or rejects the promise if something went wrong.
 */
Scan.prototype.exec = function () {
	const db = this._dynamodb.dynamodb;
	const params = this._params;
	const raw = this._raw;
	const limit = params.Limit;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = this._table.name;

	if (limit === 1 && params.FilterExpression) {
		delete params.Limit;
	}

	return pify(db.scan.bind(db))(params)
		.then(data => {
			if (params.Select === 'COUNT') {
				// Return the count property if Select is set to count.
				return data.Count || 0;
			}

			if (limit === 1) {
				// If the limit is specifically set to 1, we should return the object instead of the array.
				if (raw === true) {
					data.Items = [data.Items[0]];
					return data;
				}

				return data.Items[0];
			}

			// Resolve all the items
			return raw === true ? data : data.Items;
		});
};

// Export the scan class
module.exports = Scan;
