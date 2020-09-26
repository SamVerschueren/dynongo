import { ScanInput } from 'aws-sdk/clients/dynamodb';
import { BaseQuery } from './base-query';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';

export class Scan extends BaseQuery implements Executable {

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): ScanInput {
		const limit = this.params.Limit;

		const result: ScanInput = {
			...this.params,
			ConsistentRead: this.consistentRead,
			TableName: (this.table !).name
		};

		if (limit === 1 && result.FilterExpression) {
			delete result.Limit;
		}

		return result;
	}

	/**
	 * Execute the scan.
	 */
	exec(): Promise<any> {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		const limit = this.params.Limit;

		const query = this.buildRawQuery();

		return this.runQuery(() => db.scan(this.buildRawQuery()).promise())
			.then(data => {
				if (query.Select === 'COUNT') {
					// Return the count property if Select is set to count.
					return data.Count || 0;
				}

				if (!data.Items) {
					return [];
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
	}
}
