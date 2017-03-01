'use strict';

/**
 * Main entrypoint for the library.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var AWS = require('aws-sdk');
var pick = require('object.pick');
var Table = require('./table');
var ListTables = require('./methods/list-tables');

module.exports = {
	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  {string}	name			The name of the table that is being interacted with.
	 * @param  {object}	options			Options object.
	 * @return {Table}					The table that the user wants to interact with.
	 */
	table: function (name, options) {
		// Construct the new table object
		return new Table(name, this, options);
	},
	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  {string}	name			The name of the table that is being interacted with.
	 * @return {Table}					The table that the user wants to interact with.
	 */
	rawTable: function (name) {
		// Construct the new raw table object
		return new Table(name, this, {raw: true});
	},
	/**
	 * Method that will instantiate a dropped table.
	 *
	 * @param  {string}		 	name		The name of the table that should be dropped.
	 * @param  {object}			options		Options object.
	 * @return {DeleteTable}				The table that the user wants to drop.
	 */
	dropTable: function (name, options) {
		// Create a table and retrieve the drop action
		return this.table(name, options).drop();
	},
	/**
	 * Method that will instantiate a dropped raw table.
	 *
	 * @param  {string}		 name		The name of the table that should be dropped.
	 * @return {DeleteTable}			The table that the user wants to drop.
	 */
	dropRawTable: function (name) {
		// Create a table and retrieve the drop action
		return this.dropTable(name, {raw: true});
	},
	/**
	 * Method that will instantiate a create table object.
	 *
	 * @param  {object}		 	schema		The schema of the table that should be created.
	 * @param  {object}			options		Options object.
	 * @return {CreateTable}				A CreateTable object.
	 */
	createTable: function (schema, options) {
		if (!schema) {
			throw new TypeError('Provide a schema object');
		} else if (!schema.TableName) {
			throw new Error('The schema is missing a TableName');
		}

		// Create a table and initialize
		return this.table(schema.TableName, options).create(schema);
	},
	/**
	 * Method that will instantiate a create table object.
	 *
	 * @param  {object}		 schema		The schema of the table that should be created.
	 * @return {CreateTable}			A CreateTable object.
	 */
	createRawTable: function (schema) {
		return this.createTable(schema, {raw: true});
	},
	/**
	 * Method that will instantiate a list tables object.
	 *
	 * @return {ListTables}				A ListTables object.
	 */
	listTables: function () {
		return new ListTables(this);
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

		this.prefix = options.prefix || undefined;
		this.delimiter = options.prefixDelimiter || '.';
		this.dynamodb = new AWS.DynamoDB.DocumentClient({service: this.raw, convertEmptyValues:true});
	},
	raw: undefined
};
