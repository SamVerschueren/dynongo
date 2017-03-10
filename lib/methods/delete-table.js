'use strict';
const pify = require('pify');

/**
 * Creates a new delete table object that can then be used to built the entire
 * request.
 *
 * @param {string}		table			The name of the table that should be queried.
 * @param {DynamoDB}	dynamodb		The dynamodb object.
 */
function DeleteTable(table, dynamodb) {
	this._dynamodb = dynamodb;
	this._await = false;
	this._table = table;
	this._params = {};
}

/**
 * This will make sure the exec method returns when the table is deleted entirely.
 *
 * @param  {number}		 [ms]			The number of milliseconds the poll mechanism should wait. Default is 1000ms.
 * @return {DeleteTable}				The delete table object.
 */
DeleteTable.prototype.wait = function (ms) {
	this._await = true;
	this._awaitMs = ms || 1000;

	// Return the object so that it can be chained
	return this;
};

/**
 * This method will execute the delete table request that was built up.
 *
 * @return {Promise}					The promise object that resolves or rejects the promise if something went wrong.
 */
DeleteTable.prototype.exec = function () {
	const db = this._dynamodb.dynamodb;
	const params = this._params;
	const isAwait = this._await;
	const awaitMs = this._awaitMs;

	if (!db) {
		return Promise.reject(new Error('Call .connect() before executing queries.'));
	}

	params.TableName = this._table.name;

	return pify(db.service.deleteTable.bind(db.service), Promise)(params)
		.then(() => {
			if (isAwait === true) {
				// If await is true, start polling
				return poll();
			}
		})
		.catch(err => {
			if (err && err.name !== 'ResourceNotFoundException') {
				throw err;
			}
		});

	function poll() {
		return pollHelper()
			.then(() => poll())
			.catch(err => {
				if (err && err.name !== 'ResourceNotFoundException') {
					// If the error is not a ResourceNotFoundException, throw it further down the chain
					throw err;
				}
			});
	}

	function pollHelper() {
		return new Promise((resolve, reject) => {
			// Poll after 1000 seconds
			setTimeout(() => {
				db.service.describeTable({TableName: params.TableName}, (err, data) => {
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
module.exports = DeleteTable;
