'use strict';

/**
 * This query class uses the builder pattern that will built up the query in multiple steps.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
 
// module dependencies
var Q = require('q'),
    _ = require('lodash');

// utility
var queryUtil = require('../utils/query');

/**
 * Creates a new query object that can then be used to built the entire
 * request.
 * 
 * @param {string}          table       The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb    The dynamodb object that should be used to query to database.
 */
function Query(table, dynamodb) {
    this._dynamodb = dynamodb;
    this._params = {
        TableName: table
    };
};

/**
 * This method initializes the query object.
 * 
 * @param  {object} query           The query for the index to filter on.
 * @param  {string} [indexName]     The optional name of the global secondary index.
 * @return {Query}                  The query object.
 */
Query.prototype._initialize = function(query, indexName) {
    // Parse the query
    var parsedQuery = queryUtil.parse(query);
    
    // Add the parsed query attributes to the correct properties of the params object
    this._params.KeyConditionExpression = parsedQuery.ConditionExpression;
    this._params.ExpressionAttributeNames = _.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
    this._params.ExpressionAttributeValues = _.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);
    
    if(indexName) {
        // If the index name is provided, add it to the params object
        this._params.IndexName = indexName;
    }
    
    // Return the query so that it can be chained
    return this;
};

/**
 * With the `where` method you can filter the records more fine grained.
 * 
 * @param  {object} query           The query to filter the records on.
 * @return {Query}                  The query object.
 */
Query.prototype.where = function(query) {
    // Parse the query
    var parsedQuery = queryUtil.parse(query);
    
    // Add the parsed query attributes to the correct properties of the params object
    this._params.FilterExpression = parsedQuery.ConditionExpression;
    this._params.ExpressionAttributeNames = _.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
    this._params.ExpressionAttributeValues = _.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);
    
    // Return the query so that it can be chained
    return this;
};

/**
 * A space or comma separated list of fields that should be returned by the query.
 * 
 * @param  {string} projection      The projection string that defines which fields should be returned.
 * @return {Query}                  The query object.
 */
Query.prototype.select = function(projection) {
    // Convert space separated or comma separated lists to a single comma
    projection = projection.replace(/,? +/g, ',');
    
    // Split the projection by space
    var splittedProjection = projection.split(',');
    
    // Reconstruct the expression
    var expression = splittedProjection.map(function(p) {
        return '#k_' + p;
    }).join(', ');
    
    // Construct the names object
    var names = splittedProjection.reduce(function(result, p) {
        result['#k_' + p] = p;
        
        return result;
    }, {});
    
    // Add the projection expression and add the list of names to the attribute names list
    this._params.ProjectionExpression = expression;
    this._params.ExpressionAttributeNames = _.assign({}, this._params.ExpressionAttributeNames, names);
    
    // Return the query so that it can be chained
    return this;
};

/**
 * This method limits the number of items returned. If the limit is set to 1, the exec method
 * will return the first object instead of an array with one object.
 * 
 * @param  {number} limit           The limit of items that should be returned.
 * @return {Query}                  The query object.
 */
Query.prototype.limit = function(limit) {
    // Set the limit of returned items
    this._params.Limit = limit;
    
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