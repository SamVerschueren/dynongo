'use strict';

/**
 * The model is the base class that offers the base methods like find, findOne and
 * returns a query that can then be used to built complexer requests.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
var Query = require('./Query');

/**
 * Constructs a new concrete Model
 * 
 * @param {String}          name        The name of the model.
 * @param {DOC.DynamoDB}    dynamodb    The DynamoDB instance
 */
function Model(name, dynamodb) {
    this._name = name;
    this._dynamodb = dynamodb
}

/**
 * This method will return a list of items that match the query.
 * 
 * @param  {object} query           The query for the index to filter on.
 * @param  {string} [indexName]     The optional name of the global secondary index.
 * @return {Query}                  The query object.
 */
Model.prototype.find = function(query, indexName) {
    // Create a new query object
    var qry = new Query(this._name, this._dynamodb);
    
    // Start by invoking the find method of the query
    return qry.find(query, indexName);
};

// Export the model
module.exports = Model;