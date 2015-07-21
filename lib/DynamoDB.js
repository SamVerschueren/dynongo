'use strict';

/**
 * Main entrypoint for the library.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var Table = require('./Table'),
    AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc'),
    _ = require('lodash');

module.exports = {
    /**
     * Returns the table that can be used to interact with it.
     * 
     * @param {String}  name    The name of the table that is being interacted with.
     */
    table: function(name) {
        var nameArray = this._prefix ? [].concat(this._prefix) : [];
        nameArray.push(name);
        
        // Construct the new table object
        return new Table(nameArray.join(this._delimiter), this._dynamodb);
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
        this._delimiter = options.prefixDelimiter || '.';
        this._dynamodb = new DOC.DynamoDB(this.raw);
    },
    raw: undefined
};