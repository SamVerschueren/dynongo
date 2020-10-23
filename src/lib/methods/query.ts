import { QueryInput } from 'aws-sdk/clients/dynamodb';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { buildQueryResponse } from '../utils/query';
import { BaseQuery } from './base-query';
import { Executable } from './executable';

export class Query extends BaseQuery implements Executable {

	private error: Error | null = null;

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
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): QueryInput {
		const limit = this.params.Limit;

		const result: QueryInput = {
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
	 * Execute the query.
	 */
	async exec(): Promise<any> {
		if (this.error) {
			return Promise.reject(this.error);
		}

		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		const query = this.buildRawQuery();
		const data = await this.runQuery(() => db.query(query).promise());
		return buildQueryResponse(query, data, this.params.Limit, this.rawResult);
	}
}
