'use strict';

/**
 * The table is the base class that offers the base methods like find, findOne and
 * returns a query that can then be used to built complexer requests.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */
var Query = require('./methods/query');
var Scan = require('./methods/scan');
var InsertItem = require('./methods/insert-item');
var UpdateItem = require('./methods/update-item');
var DeleteItem = require('./methods/delete-item');
var DeleteTable = require('./methods/delete-table');
var CreateTable = require('./methods/create-table');
var table = require('./utils/table');

/**
 * Constructs a new concrete Table
 *
 * @param {String}			name		The name of the table.
 * @param {DOC.DynamoDB}	dynamodb	The DynamoDB instance.
 * @param {object}			options		Options object.
 */
function Table(name, dynamodb, options) {
	this._name = name;
	this._options = options || {};
	this._dynamodb = dynamodb;

	Object.defineProperty(this, 'name', {
		get: function () {
			if (this._options.raw === true) {
				return this._name;
			}

			return table.lookupName(this._name, this._dynamodb);
		}
	});
}

/**
 * This method will return a list of items that match the query.
 *
 * @param  {object}	 	query			The query for the index to filter on.
 * @param  {string}	 	[indexName]		The optional name of the global secondary index.
 * @return {Query}						The query object.
 */
Table.prototype.find = function (query, indexName) {
	if (query === undefined) {
		// If query is not provided, the caller wants to perform a full table scan.
		return new Scan(this, this._dynamodb);
	}

	// Create a new query object
	var qry = new Query(this, this._dynamodb);

	// Start by invoking the find method of the query
	return qry._initialize(query, indexName);
};

/**
 * This method will return only the first result.
 *
 * @param  {object}	 	query			The query for the index to filter on.
 * @param  {string}	 	[indexName]		The optional name of the global secondary index.
 * @return {Query}						The query object.
 */
Table.prototype.findOne = function (query, indexName) {
	// Use the find method but limit the result to 1 and return the first object
	return this.find(query, indexName).limit(1);
};

/**
 * Return and remove a record.
 *
 * @param  {object}	 	query			The query for the index to filter on.
 * @return {DeleteItem}					The delete item object.
 */
Table.prototype.findOneAndRemove = function (query) {
	// Create a new delete item object
	var del = new DeleteItem(this, this._dynamodb);

	// Start by invoking the remove method
	return del._initialize(query, {result: true});
};

/**
 * This method will insert a new item in the table.
 *
 * @param  {object}	 	key				The primary key of the record we want to insert.
 * @param  {string}	 	data			The data associated with the primary key..
 * @return {UpdateItem}					The update item object.
 */
Table.prototype.insert = function (key, data) {
	// Create an update item object
	var put = new InsertItem(this, this._dynamodb);

	// Initialize the update item object
	return put._initialize(key, {$set: data});
};

/**
 * This method will update an already existing item associated with the key provided.
 *
 * @param  {object}		key				The key of the item we wish to update.
 * @param  {object}	 	data			The data of the item to update the item with.
 * @param  {object}	 	[options]		The extra options object.
 * @return {UpdateItem}					The update item object.
 */
Table.prototype.update = function (key, data, options) {
	// Use a default empty object if options is not provided
	options = options || {};

	// Create a new update item object
	var update = new UpdateItem(this, this._dynamodb);

	if (options.upsert && options.upsert === true) {
		// If upsert is set to true, it does a update or insert
		return update._initialize(key, {$set: data});
	}

	// Initialize the update item object and use the conditional statement to make sure the item exists.
	return update._initialize(key, data).where(key);
};

/**
 * This method will update an already existing item or inserts a new item if the item does not yet
 * exist.
 *
 * @param  {object}	 	key				The key of the item we wish to update.
 * @param  {object}	 	data			The data of the item to update the item with.
 * @return {UpdateItem}					The update item object.
 */
Table.prototype.upsert = function (key, data) {
	// Use the update method but set `upsert` to true
	return this.update(key, data, {upsert: true});
};

/**
 * This method will remove an object from the specified table.
 *
 * @param  {object}	 	query			The query for the index to filter on.
 * @return {DeleteItem}					The delete item object.
 */
Table.prototype.remove = function (query) {
	// Create a new delete item object
	var del = new DeleteItem(this, this._dynamodb);

	// Start by invoking the remove method
	return del._initialize(query);
};

/**
 * This method will drop the table.
 *
 * @return {DeleteTable}				The delete table object.
 */
Table.prototype.drop = function () {
	// Create a new DeleteTable object
	return new DeleteTable(this, this._dynamodb);
};

/**
 * This method will create a new table.
 *
 * @param  {object}		 schema			The schema object.
 * @return {CreateTable}				The create table object.
 */
Table.prototype.create = function (schema) {
	if (!schema) {
		throw new TypeError('Provide a schema object');
	}

	// Create a new CreateTable object
	return new CreateTable(this, this._dynamodb)._initialize(schema);
};

// Export the table class
module.exports = Table;
