'use strict';

/**
 * Main entrypoint for the library.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var AWS = require('aws-sdk');
var pick = require('object-pick');
var Table = require('./Table');

module.exports = {
	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  {string}  name			The name of the table that is being interacted with.
	 * @return {Table}					The table that the user wants to interact with.
	 */
	table: function (name) {
		var nameArray = this._prefix ? [].concat(this._prefix) : [];
		nameArray.push(name);

		// Construct the new table object
		return new Table(nameArray.join(this._delimiter), this._dynamodb);
	},
	/**
	 * Method that will instantiate a dropped table.
	 *
	 * @param  {string}		 name		The name of the table that should be dropped.
	 * @return {DeleteTable}			The table that the user wants to drop.
	 */
	dropTable: function (name) {
		// Create a table and retrieve the drop action
		return this.table(name).drop();
	},
	/**
	 * Method that will instantiate a create table object.
	 *
	 * @param  {object}		 schema		The schema of the table that should be created.
	 * @return {CreateTable}			A CreateTable object.
	 */
	createTable: function (schema) {
		if (!schema.TableName) {
			throw new Error('The schema is missing a TableName');
		}

		// Create a table and initialize
		return this.table(schema.TableName).create(schema);
	},
	/**
	 * Initializes the database settings.
	 *
	 * @param {object}		  options	An options object.
	 */
	connect: function (options) {
		// Use an empty object if no options object is provided.
		options = options || {};

		AWS.config.update(pick(options, ['region', 'accessKeyId', 'secretAccessKey']));

		if (options.local) {
			var host = options.host || 'localhost';

			// Starts dynamodb in local mode
			this.raw = new AWS.DynamoDB({endpoint: new AWS.Endpoint('http://' + host + ':' + (options.localPort || 8000))});
		} else {
			// Starts dynamodb in remote mode
			this.raw = new AWS.DynamoDB();
		}

		this._prefix = options.prefix || undefined;
		this._delimiter = options.prefixDelimiter || '.';
		this._dynamodb = new AWS.DynamoDB.DocumentClient({service: this.raw});
	},
	raw: undefined
};
