'use strict';

/**
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

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