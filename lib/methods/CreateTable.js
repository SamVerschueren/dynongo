'use strict';

/**
 * This class forms the builder pattern for creating a table.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  15 Sep. 2015
 */

// module dependencies
var Promise = require('pinkie-promise');
var pify = require('pify');

// utility
var tableUtil = require('../utils/table');

/**
 * Creates a new create table object that can then be used to built the entire
 * request.
 *
 * @param {string}		table           The name of the table that should be queried.
 * @param {DynamoDB}	dynamodb        The dynamodb object.
 */
function CreateTable(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._table = table;
	this._await = false;
	this._params = {};
}

/**
 * This method will initialize the request with the schema.
 *
 * @param  {object}		 schema		  	The schema of the table.
 * @return {CreateTable}				The delete item object.
 */
CreateTable.prototype._initialize = function (schema) {
	// Set the schema as params object
	this._params = schema;

	// Return the object so that it can be chained
	return this;
};

/**
 * This will make sure the exec method returns when the table is created entirely.
 *
 * @param  {number}			 [ms]		The number of milliseconds the poll mechanism should wait. Default is 1000ms.
 * @return {CreateTable}				The create table object.
 */
CreateTable.prototype.await = function (ms) {
	this._await = true;
	this._awaitMs = ms || 1000;

	// Return the object so that it can be chained
	return this;
};

/**
 * This method will execute the create table request that was built up.
 *
 * @return {Promise}					The promise object that resolves or rejects the promise if something went wrong.
 */
CreateTable.prototype.exec = function () {
	var db = this._dynamodb._dynamodb;
	var params = this._params;
	var isAwait = this._await;
	var awaitMs = this._awaitMs;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = tableUtil.lookupName(this._table, this._dynamodb);

	return pify(db.service.createTable.bind(db.service), Promise)(params)
		.then(function () {
			if (isAwait === true) {
				// Start polling if await is set to true
				return poll();
			}
		})
		.catch(function (err) {
			if (err && err.name !== 'ResourceInUseException') {
				// If it is a ResourceInUseException, throw it further down the chain
				throw err;
			}
		});

	function poll() {
		return pollHelper()
			.then(function (data) {
				if (data.Table.TableStatus.toLowerCase() !== 'active') {
					return poll();
				}
			});
	}

	function pollHelper() {
		return new Promise(function (resolve, reject) {
			// Poll after 1000 seconds
			setTimeout(function () {
				db.service.describeTable({TableName: params.TableName}, function (err, data) {
					if (err) {
						// Reject if an error occurred
						return reject(err);
					}

					// Resolve the data
					resolve(data);
				});
			}, awaitMs);
		});
	}
};

// Export the module
module.exports = CreateTable;
