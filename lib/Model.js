'use strict';

/**
 * The model is the base class that offers the base methods like find, findOne and
 * returns a query that can then be used to built complexer requests.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
var Query = require('./methods/Query'),
    DeleteItem = require('./methods/DeleteItem'),
    UpdateItem = require('./methods/UpdateItem');

/**
 * Constructs a new concrete Model
 * 
 * @param {String}          name        The name of the model.
 * @param {DOC.DynamoDB}    dynamodb    The DynamoDB instance
 */
function Model(name, dynamodb) {
    this._name = name;
    this._dynamodb = dynamodb;
}

/**
 * This method will return a list of items that match the query.
 * 
 * @param  {object}     query           The query for the index to filter on.
 * @param  {string}     [indexName]     The optional name of the global secondary index.
 * @return {Query}                  The query object.
 */
Model.prototype.find = function(query, indexName) {
    // Create a new query object
    var qry = new Query(this._name, this._dynamodb);
    
    // Start by invoking the find method of the query
    return qry._initialize(query, indexName);
};

/**
 * This method will remove an object from the specified table.
 * 
 * @param  {object}     query           The query for the index to filter on.
 * @return {DeleteItem}                 The delete item object.
 */
Model.prototype.remove = function(query) {
    // Create a new delete item object
    var del = new DeleteItem(this._name, this._dynamodb);
    
    // Start by invoking the remove method
    return del._initialize(query);
};

/**
 * This method will update an already existing item associated with the key provided.
 * 
 * @param  {object}     key             The key of the item we wish to update.
 * @param  {object}     data            The data of the item to update the item with.
 * @return {UpdateItem}                 The update item object.
 */
Model.prototype.update = function(key, data) {
    // Create a new create item object
    var update = new UpdateItem(this._name, this._dynamodb);
    
    // Initialize the update item object and use the conditional statement to make sure the item exists.
    return update._initialize(key, data)._where(key);
};

// Export the model
module.exports = Model;