import { DynamoDB } from './dynamodb';
import { Query, Scan, InsertItem, UpdateItem, DeleteItem, DeleteTable, CreateTable } from './methods';
import * as table from './utils/table';
import { operators as updateOperators } from './utils/update';
import { Map, Schema } from './types';

export interface TableOptions {
	raw?: boolean;
}

export class Table {

	private options: TableOptions;

	constructor(
		private tableName: string,
		private dynamodb: DynamoDB,
		options?: TableOptions
	) {
		this.options = {
			raw: false,
			...options
		};
	}

	get name() {
		if (this.options.raw === true) {
			return this.tableName;
		}

		return table.lookupName(this.tableName, this.dynamodb);
	}

	find(): Scan;
	find(query: any, indexName?: string): Query;

	/**
	 * Initialize a query builder.
	 *
	 * @param  query			The query for the index to filter on.
	 * @param  indexName		The name of the global secondary index.
	 */
	find(query?: any, indexName?: string) {
		if (query === undefined) {
			// If query is not provided, the caller wants to perform a full table scan.
			return new Scan(this, this.dynamodb);
		}

		// Create a new query object
		const qry = new Query(this, this.dynamodb);

		// Start by invoking the find method of the query
		return qry.initialize(query, indexName);
	}

	/**
	 * Initialize a query builder that is limitted to one result.
	 *
	 * @param  query			The query for the index to filter on.
	 * @param  indexName		The name of the global secondary index.
	 */
	findOne(query?: any, indexName?: string) {
		// Use the find method but limit the result to 1 and return the first object
		return this.find(query, indexName).limit(1);
	}

	/**
	 * Return and remove a record.
	 *
	 * @param	query			The query for the index to filter on.
	 */
	findOneAndRemove(query: any) {
		// Create a new delete item object
		const del = new DeleteItem(this, this.dynamodb);

		// Start by invoking the remove method
		return del.initialize(query, {result: true});
	}

	/**
	 * This method will insert a new item in the table.
	 *
	 * @param  key				The primary key of the record we want to insert.
	 * @param  data			The data associated with the primary key.
	 */
	insert(key: Map<string | number>, data?: any) {
		// Create an insert item object
		const put = new InsertItem(this, this.dynamodb);

		// Initialize the insert item object
		return put.initialize(key, {$set: data});
	}

	/**
	 * Update an already existing item associated with the key provided.
	 *
	 * @param	key				The key of the item we wish to update.
	 * @param	data			The data of the item to update the item with.
	 * @param	options			The extra options object.
	 */
	update(key: any, data: any, options?: any) {
		// Use a default empty object if options is not provided
		options = options || {};

		// Create a new update item object
		const update = new UpdateItem(this, this.dynamodb);

		if (options.upsert && options.upsert === true) {
			const params = Object.create(null);

			for (const key of Object.keys(data)) {
				if (updateOperators.indexOf(key) !== -1) {
					params[key] = data[key];
					delete data[key];
				}
			}

			// Merge `$set` with the other data values
			params['$set'] = {
				...params['$set'],
				...data
			};

			// If upsert is set to true, it does a update or insert
			return update.initialize(key, params);
		}

		// Initialize the update item object and use the conditional statement to make sure the item exists.
		return update.initialize(key, data).where(key);
	}

	/**
	 * Update an already existing item or inserts a new item if the item does not yet exist.
	 *
	 * @param	key				The key of the item we wish to update.
	 * @param	data			The data of the item to update the item with.
	 */
	upsert(key: any, data: any) {
		// Use the update method but set `upsert` to true
		return this.update(key, data, {upsert: true});
	}

	/**
	 * Remove an object.
	 *
	 * @param	query			The query for the index to filter on.
	 */
	remove(query: any) {
		// Create a new delete item object
		const del = new DeleteItem(this, this.dynamodb);

		// Start by invoking the remove method
		return del.initialize(query);
	}

	/**
	 * Drop the table.
	 */
	drop() {
		// Create a new DeleteTable object
		return new DeleteTable(this, this.dynamodb);
	}

	/**
	 * This method will create a new table.
	 *
	 * @param	schema			The schema object.
	 */
	create(schema: Schema) {
		if (typeof schema !== 'object') {
			throw new TypeError(`Expected \`schema\` to be of type \`object\`, got \`${typeof schema}\``);
		}

		// Create a new CreateTable object
		return new CreateTable(this, this.dynamodb).initialize(schema);
	}
}
