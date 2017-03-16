import * as pify from 'pify';
import { BaseQuery } from './base-query';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';

export class Query extends BaseQuery implements Executable {

	private error: Error;

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * The order in which to return the query results - either ascending (1) or descending (-1).
	 *
	 * @param	order		The order in which to return the query results.
	 */
	sort(order: 1 | -1) {
		if (order !== 1 && order !== -1) {
			// Set the error if the order is invalid
			this.error = new Error('Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.');
		} else {
			// Set the ScanIndexForward property
			this.params.ScanIndexForward = order === 1;
		}

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Execute the query.
	 */
	exec() {
		if (this.error) {
			return Promise.reject(this.error);
		}

		const db = this.dynamodb.dynamodb;
		const limit = this.params.Limit;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		this.params.TableName = this.table.name;

		if (limit === 1 && this.params.FilterExpression) {
			delete this.params.Limit;
		}

		return pify(db.query.bind(db))(this.params)
			.then(data => {
				if (this.params.Select === 'COUNT') {
					// Return the count property if Select is set to count.
					return data.Count || 0;
				}

				if (limit === 1) {
					// If the limit is specifically set to 1, we should return the object instead of the array.
					if (this.rawResult === true) {
						data.Items = [data.Items[0]];
						return data;
					}

					return data.Items[0];
				}

				// Return all the items
				return this.rawResult === true ? data : data.Items;
			});
	};
}
