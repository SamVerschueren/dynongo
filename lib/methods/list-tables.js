'use strict';

/**
 * This class forms the builder pattern for listing all the tables.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  24 Jan. 2015
 */

// module dependencies
var Promise = require('pinkie-promise');
var pify = require('pify');

/**
 * Creates a new list tables object that can then be used to built the entire
 * request.
 *
 * @param {DynamoDB}		dynamodb		The dynamodb object.
 */
function ListTables(dynamodb) {
	this._dynamodb = dynamodb;
}

/**
 * This method will execute the list table request that was built up.
 *
 * @return {Promise}						The promise object that resolves all the tables.
 */
ListTables.prototype.exec = function () {
	var db = this._dynamodb._dynamodb;
	var prefix = this._dynamodb._prefix;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	function execHelper(result, params) {
		result = result || [];
		params = params || {};

		return pify(db.service.listTables.bind(db.service), Promise)(params)
			.then(function (data) {
				result = result.concat(data.TableNames);

				if (data.LastEvaluatedTableName) {
					params.ExclusiveStartTableName = data.LastEvaluatedTableName;
					return execHelper(result, params);
				}

				return prefix === undefined ? result : result.filter(function (table) {
					return table.indexOf(prefix) === 0;
				});
			});
	}

	return execHelper();
};

// Export the module
module.exports = ListTables;
