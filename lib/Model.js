'use strict';

/**
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

Model.prototype.find = function(query, indexName) {
    var qry = new Query(this._dynamodb);
    
    qry.find(query, indexName);
    
    return qry;
};

Model.prototype.findOne = function(query, indexName) {
    var qry = new Query(this._dynamodb);
    
    qry.findOne(query, indexName);
    
    return qry;
};

module.exports = Model;