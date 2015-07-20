'use strict';

/**
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  19 Jul. 2015
 */
 
// module dependencies
var Q = require('q'),
    _ = require('lodash');

// utility
var queryUtil = require('../utils/query'),
    updateUtil = require('../utils/update');

/**
 * Creates a new update item object that can then be used to built the entire
 * request.
 * 
 * @param {string}          table       The name of the table that should be queried.
 * @param {DOC.DynamoDB}    dynamodb    The dynamodb object that should be used to query to database.
 */
function UpdateItem(table, dynamodb) {
    this._dynamodb = dynamodb;
    this._params = {
        TableName: table,
        ReturnValues: 'ALL_NEW'
    };
};

UpdateItem.prototype.initialize = function(query, data) {
    // Set the query as key
    this._params.Key = query;
    
    var parsedUpdate = updateUtil.parse(data);
    
    this._params.UpdateExpression = parsedUpdate.UpdateExpression;
    this._params.ExpressionAttributeNames = _.assign({}, this._params.ExpressionAttributeNames, parsedUpdate.ExpressionAttributeNames);
    this._params.ExpressionAttributeValues = _.assign({}, this._params.ExpressionAttributeValues, parsedUpdate.ExpressionAttributeValues);
    
    // Return the object so that it can be chained
    return this;
};

UpdateItem.prototype.where = function(query) {
    // Parse the query
    var parsedQuery = queryUtil.parse(query);
    
    // Add the parsed query attributes to the correct properties of the params object
    this._params.ConditionExpression = parsedQuery.ConditionExpression;
    this._params.ExpressionAttributeNames = _.assign({}, this._params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
    this._params.ExpressionAttributeValues = _.assign({}, this._params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);
    
    // Return the object for chaining purposes
    return this;
};

UpdateItem.prototype.exec = function() {
    var dynamodb = this._dynamodb,
        params = this._params;
        
    console.log(params);
    
    return Q.Promise(function(resolve, reject) {
        // Execute the correct method with the params that are built during the building process
        dynamodb.updateItem(params, function(err, data) {
            if(err) {
                // Reject the promise if something went wrong
                return reject(err);
            }
            
            console.log(data);
            
            // Resolve the data if everything went well.
            resolve(data.Attributes);
        });
    });
};

// Export the module
module.exports = UpdateItem;