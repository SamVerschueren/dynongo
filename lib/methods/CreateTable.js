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

/**
 * Creates a new create table object that can then be used to built the entire
 * request.
 *
 * @param {string}		  	table	   	The name of the table that should be created.
 * @param {DOC.DynamoDB}	dynamodb	The dynamodb object that should be used to query to database.
 */
function CreateTable(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._await = false;
	this._params = {
		TableName: table
	};
}

/**
 * This method will initialize the request with the schema.
 *
 * @param  {object}		 schema		  	The schema of the table.
 * @return {CreateTable}				The delete item object.
 */
CreateTable.prototype._initialize = function (schema) {
	// Overwrite the table name of the schema
	schema.TableName = this._params.TableName;

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
	var dynamodb = this._dynamodb;
	var params = this._params;
	var isAwait = this._await;
	var awaitMs = this._awaitMs;

	return pify(dynamodb.service.createTable, Promise)(params)
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
				dynamodb.service.describeTable({TableName: params.TableName}, function (err, data) {
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
