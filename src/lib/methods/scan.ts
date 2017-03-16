import * as pify from 'pify';
import { BaseQuery } from './base-query';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';

export class Scan extends BaseQuery implements Executable {

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * Execute the scan.
	 */
	exec(): Promise<any> {
		const db = this.dynamodb.dynamodb;
		const limit = this.params.Limit;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		this.params.TableName = this.table.name;

		if (limit === 1 && this.params.FilterExpression) {
			delete this.params.Limit;
		}

		return pify(db.scan.bind(db))(this.params)
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

				// Resolve all the items
				return this.rawResult === true ? data : data.Items;
			});
	};
}
