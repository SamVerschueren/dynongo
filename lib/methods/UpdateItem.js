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
var queryUtil = require('../utils/query');

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
        TableName: table
    };
};

UpdateItem.prototype.initialize = function(query) {
    // Set the query as key
    this._params.Key = query;
    
    // Return the object so that it can be chained
    return this;
};

UpdateItem.prototype.exec = function() {
    
};

// Export the module
module.exports = UpdateItem;