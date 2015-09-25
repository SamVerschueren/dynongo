'use strict';

/**
 * This scan class uses the builder pattern that will built up the scan in multiple steps.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  22 Jul. 2015
 */

// module dependencies
var util = require('util'),
    Q = require('q'),
    _ = require('lodash');

var BaseQuery = require('./BaseQuery');

/**
 * Creates a new scan object that can then be used to built the entire
 * request.
 *
 * @param {string}          table       The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb    The dynamodb object that should be used to scan to database.
 */
function Scan(table, dynamodb) {
    BaseQuery.call(this, table, dynamodb);
}

// Inherit from BaseQuery
util.inherits(Scan, BaseQuery);

/**
 * This method will execute the scan that was built to the dynamodb database.
 *
 * @return {Promise}        The promise object that resolves the data or rejects the promise if something went wrong.
 */
Scan.prototype.exec = function() {
    var dynamodb = this._dynamodb,
        params = this._params;

    return Q.Promise(function(resolve, reject) {
        // Execute the correct method with the params that are built during the building process
        dynamodb.scan(params, function(err, data) {
            if(err) {
                // Reject the promise if something went wrong
                return reject(err);
            }

            if(params.Limit === 1) {
                // If the limit is specifically set to 1, we should return the object instead of the array.
                return resolve(data.Items[0]);
            }

            // Resolve the data if everything went well.
            resolve(data.Items);
        });
    });
};

// Export the scan class
module.exports = Scan;