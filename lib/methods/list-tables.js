'use strict';
const pify = require('pify');

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
	const db = this._dynamodb.dynamodb;
	const prefix = this._dynamodb._prefix;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	function execHelper(result, params) {
		result = result || [];
		params = params || {};

		return pify(db.service.listTables.bind(db.service))(params)
			.then(data => {
				result = result.concat(data.TableNames);

				if (data.LastEvaluatedTableName) {
					params.ExclusiveStartTableName = data.LastEvaluatedTableName;
					return execHelper(result, params);
				}

				return prefix === undefined ? result : result.filter(table => {
					return table.indexOf(prefix) === 0;
				});
			});
	}

	return execHelper();
};

// Export the module
module.exports = ListTables;
