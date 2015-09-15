'use strict';

/**
 * This class forms the builder pattern for deleting a table.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  15 Sep. 2015
 */

// module dependencies
var Q = require('q');

/**
 * Creates a new delete table object that can then be used to built the entire
 * request.
 *
 * @param {string}          table       The name of the table that should be removed.
 * @param {DOC.DynamoDB}    dynamodb    The dynamodb object that should be used to query to database.
 */
function DeleteTable(table, dynamodb) {
    this._dynamodb = dynamodb;
    this._await = false;
    this._params = {
        TableName: table
    };
};

/**
 * This will make sure the exec method returns when the table is deleted entirely.
 *
 * @param  {number}         [ms]        The number of milliseconds the poll mechanism should wait. Default is 1000ms.
 * @return {DeleteTable}                The delete table object.
 */
DeleteTable.prototype.await = function(ms) {
    this._await = true;
    this._awaitMs = ms || 1000;

    // Return the object so that it can be chained
    return this;
};

/**
 * This method will execute the delete table request that was built up.
 *
 * @return {Promise}                    The promise object that resolves or rejects the promise if something went wrong.
 */
DeleteTable.prototype.exec = function() {
    var dynamodb = this._dynamodb,
        params = this._params,
        await = this._await,
        awaitMs = this._awaitMs;

    return Q.Promise(function (resolve, reject) {
        // Execute the correct method with the params that are built during the building process
        dynamodb.service.deleteTable(params, function(err, data) {
            if(err) {
                if(err.name === 'ResourceNotFoundException') {
                    // If the resource was not found, it means it is already removed
                    return resolve();
                }
                else {
                    // Something went wrong
                    return reject(err);
                }
            }

            if(await !== true) {
                // If await is not true, just resolve the promise
                return resolve();
            }

            // Start polling
            resolve(poll());
        });
    });

    function poll() {
        return pollHelper()
            .then(function() {
                // If the promise returns, poll again
                return poll();
            })
            .catch(function(err) {
                if(err && err.name !== 'ResourceNotFoundException') {
                    // If the error is not a ResourceNotFoundException, throw it further down the chain
                    throw err;
                }
            });
    }

    function pollHelper() {
        return Q.Promise(function(resolve, reject) {
            // Poll after 1000 seconds
            setTimeout(function() {
                dynamodb.service.describeTable({ TableName: params.TableName }, function(err, data) {
                    if(err) {
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