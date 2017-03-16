import * as pify from 'pify';
import { Method } from './method';
import { Executable } from './executable';
import { Schema } from '../types/schema';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';

export class CreateTable extends Method implements Executable {

	private shouldWait = false;
	private waitMs: number;
	private schema: any;

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * Initialize the `CreateTable` object.
	 *
	 * @param	schema			The schema of the table.
	 */
	initialize(schema: Schema) {
		// Set the schema as params object
		this.schema = schema;

		// Return the object so that it can be chained
		return this;
	}

	/**
	 * Make sure the exec method returns when the table is created entirely.
	 *
	 * @param	ms		The number of milliseconds the poll mechanism should wait. Default is 1000ms.
	 */
	wait(ms?: number) {
		this.shouldWait = true;
		this.waitMs = ms || 1000;

		// Return the object so that it can be chained
		return this;
	}

	/**
	 * This method will execute the create table request that was built up.
	 *
	 * @return {Promise}					The promise object that resolves or rejects the promise if something went wrong.
	 */
	exec() {
		const db = this.dynamodb.raw;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		this.schema.TableName = this.table.name;

		return pify(db.createTable.bind(db))(this.schema)
			.then(() => {
				if (this.shouldWait === true) {
					// Start polling if await is set to true
					return this.poll();
				}
			})
			.catch(err => {
				if (err && err.name !== 'ResourceInUseException') {
					// If it is a ResourceInUseException, throw it further down the chain
					throw err;
				}
			});
	}

	private poll() {
		return this.pollHelper()
			.then((data: any) => {
				if (data.Table.TableStatus.toLowerCase() !== 'active') {
					return this.poll();
				}
			});
	}

	private pollHelper() {
		return new Promise((resolve, reject) => {
			// Poll after 1000 seconds
			setTimeout(() => {
				const db = this.dynamodb.raw;

				db.describeTable({TableName: this.schema.TableName}, (err, data) => {
					if (err) {
						// Reject if an error occurred
						return reject(err);
					}

					// Resolve the data
					resolve(data);
				});
			}, this.waitMs);
		});
	}
}
