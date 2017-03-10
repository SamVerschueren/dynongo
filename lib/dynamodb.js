'use strict';
const AWS = require('aws-sdk');
const pick = require('object.pick');
const Table = require('./table');
const ListTables = require('./methods/list-tables');

const dynamodb = {
	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  {string}	name			The name of the table that is being interacted with.
	 * @param  {object}	options			Options object.
	 * @return {Table}					The table that the user wants to interact with.
	 */
	table: (name, options) => {
		// Construct the new table object
		return new Table(name, dynamodb, options);
	},
	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  {string}	name			The name of the table that is being interacted with.
	 * @return {Table}					The table that the user wants to interact with.
	 */
	rawTable: name => {
		// Construct the new raw table object
		return new Table(name, dynamodb, {raw: true});
	},
	/**
	 * Method that will instantiate a dropped table.
	 *
	 * @param  {string}		 	name		The name of the table that should be dropped.
	 * @param  {object}			options		Options object.
	 * @return {DeleteTable}				The table that the user wants to drop.
	 */
	dropTable: (name, options) => {
		// Create a table and retrieve the drop action
		return dynamodb.table(name, options).drop();
	},
	/**
	 * Method that will instantiate a dropped raw table.
	 *
	 * @param  {string}		 name		The name of the table that should be dropped.
	 * @return {DeleteTable}			The table that the user wants to drop.
	 */
	dropRawTable: name => {
		// Create a table and retrieve the drop action
		return dynamodb.dropTable(name, {raw: true});
	},
	/**
	 * Method that will instantiate a create table object.
	 *
	 * @param  {object}		 	schema		The schema of the table that should be created.
	 * @param  {object}			options		Options object.
	 * @return {CreateTable}				A CreateTable object.
	 */
	createTable: (schema, options) => {
		if (!schema) {
			throw new TypeError('Provide a schema object');
		} else if (!schema.TableName) {
			throw new Error('The schema is missing a TableName');
		}

		// Create a table and initialize
		return dynamodb.table(schema.TableName, options).create(schema);
	},
	/**
	 * Method that will instantiate a create table object.
	 *
	 * @param  {object}		 schema		The schema of the table that should be created.
	 * @return {CreateTable}			A CreateTable object.
	 */
	createRawTable: schema => {
		return dynamodb.createTable(schema, {raw: true});
	},
	/**
	 * Method that will instantiate a list tables object.
	 *
	 * @return {ListTables}				A ListTables object.
	 */
	listTables: () => {
		return new ListTables(dynamodb);
	},
	/**
	 * Initializes the database settings.
	 *
	 * @param {object}		  options	An options object.
	 */
	connect: options => {
		// Use an empty object if no options object is provided.
		options = options || {};

		AWS.config.update(pick(options, ['region', 'accessKeyId', 'secretAccessKey']));

		if (options.local) {
			const host = options.host || 'localhost';

			// Starts dynamodb in local mode
			dynamodb.raw = new AWS.DynamoDB({endpoint: new AWS.Endpoint('http://' + host + ':' + (options.localPort || 8000))});
		} else {
			// Starts dynamodb in remote mode
			dynamodb.raw = new AWS.DynamoDB();
		}

		dynamodb.prefix = options.prefix || undefined;
		dynamodb.delimiter = options.prefixDelimiter || '.';
		dynamodb.dynamodb = new AWS.DynamoDB.DocumentClient({service: dynamodb.raw});
	},
	raw: undefined
};

module.exports = dynamodb;
