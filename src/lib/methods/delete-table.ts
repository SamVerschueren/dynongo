import * as pify from 'pify';
import { Method } from './method';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';

export class DeleteTable extends Method implements Executable {

	private shouldWait = false;
	private waitMs: number;

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * Make sure the exec method returns when the table is deleted entirely.
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
	 * This method will execute the delete table request that was built up.
	 */
	exec() {
		const db = this.dynamodb.raw;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		this.params.TableName = this.table.name;

		return pify(db.deleteTable.bind(db), Promise)(this.params)
			.then(() => {
				if (this.shouldWait === true) {
					// If await is true, start polling
					return this.poll();
				}
			})
			.catch(err => {
				if (err && err.name !== 'ResourceNotFoundException') {
					throw err;
				}
			});
	}

	private poll() {
		return this.pollHelper()
			.then(() => this.poll())
			.catch(err => {
				if (err && err.name !== 'ResourceNotFoundException') {
					// If the error is not a ResourceNotFoundException, throw it further down the chain
					throw err;
				}
			});
	}

	private pollHelper() {
		return new Promise((resolve, reject) => {
			// Poll after 1000 seconds
			setTimeout(() => {
				const db = this.dynamodb.raw;

				db.describeTable({TableName: this.params.TableName}, (err, data) => {
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
