'use strict';

/**
 * Main entrypoint for the library.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var Model = require('./Model'),
    AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc'),
    _ = require('lodash');

module.exports = {
    /**
     * Returns the model that can be used to interact with the database
     * 
     * @param {String}  name    The name of the table that is being interacted with.
     */
    model: function(name) {
        var nameArray = this._prefix ? [].concat(this._prefix) : [];
        nameArray.push(name);
        
        // Construct the new model
        return new Model(nameArray.join(this._delimiter), this._dynamodb);
    },
    /**
     * 
     */
    connect: function(options) {
        AWS.config.update(_.pick(options, ['region', 'accessKeyId', 'secretAccessKey']));
        
        if(options.local) {
            // Starts dynamodb in local mode
            this.raw = new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://localhost:' + (options.localPort || 8000)) });
        }
        else {
            // Starts dynamodb in remote mode
            this.raw = new AWS.DynamoDB();
        }
        
        this._prefix = options.prefix || undefined;
        this._delimiter = options.delimiter || '.';
        this._dynamodb = new DOC.DynamoDB(this.raw);
    },
    raw: undefined
};