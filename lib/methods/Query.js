'use strict';

/**
 * This query class uses the builder pattern that will built up the query in multiple steps.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
 
// module dependencies
var util = require('util'),
    Q = require('q'),
    _ = require('lodash');

var BaseQuery = require('./BaseQuery');   

/**
 * Creates a new query object that can then be used to built the entire
 * request.
 * 
 * @param {string}          table       The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb    The dynamodb object that should be used to query to database.
 */
function Query(table, dynamodb) {
    BaseQuery.call(this, table, dynamodb);
};

// Inherit from Query
util.inherits(Query, BaseQuery);

/**
 * Specifies the order in which to return the query results - either ascending (1) or descending (-1).
 * 
 * @param  {number} order   The order in which to return the query results.   
 * @return {Query}          The query object.
 */
Query.prototype.sort = function(order) {
    if(order !== 1 && order !== -1) {
        // Do nothing if the order is not 1 or -1
        throw new Error('Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.')
    }
    
    // Set the ScanIndexForward property
    this._params.ScanIndexForward = order === 1;
    
    // Return the query so that it can be chained
    return this;
};

/**
 * This method will execute the query that was built to the dynamodb database.
 * 
 * @return {Promise}        The promise object that resolves the data or rejects the promise if something went wrong.
 */
Query.prototype.exec = function() {
    var dynamodb = this._dynamodb,
        params = this._params;
    
    return Q.Promise(function(resolve, reject) {
        // Execute the correct method with the params that are built during the building process
        dynamodb.query(params, function(err, data) {
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

// Export the query
module.exports = Query;