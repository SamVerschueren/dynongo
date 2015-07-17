'use strict';

/**
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
 
// module dependencies
var Q = require('q'),
    _ = require('lodash');

// utility
var queryUtil = require('./utils/query');

function Query(dynamodb) {
    this._dynamodb = dynamodb;
    this._params = {};
};

Query.prototype.find = function(query, indexName) {
    // Store the dynamodb method that should be used to execute
    this._method = 'query';
    
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
};

Query.prototype.exec = function() {
    var dynamodb = this._dynamodb,
        method = this._method,
        params = this._params;
    
    return Q.Promise(function(resolve, reject) {
        dynamodb[method].call(dynamodb, params, function(err, data) {
            if(err) {
                return reject(err);
            }
            
            resolve(data.Items);
        });
    });
};

module.exports = Query;