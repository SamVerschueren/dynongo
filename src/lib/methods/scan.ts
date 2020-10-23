import { ScanInput } from 'aws-sdk/clients/dynamodb';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { buildQueryResponse } from '../utils/query';
import { BaseQuery } from './base-query';
import { Executable } from './executable';

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
	async exec(): Promise<any> {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		const query = this.buildRawQuery();
		const data = await this.runQuery(() => db.scan(query).promise());
		return buildQueryResponse(query, data, this.params.Limit, this.rawResult);
	}
}
