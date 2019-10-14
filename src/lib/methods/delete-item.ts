import { DeleteItemInput } from 'aws-sdk/clients/dynamodb';
import { Method } from './method';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import * as queryUtil from '../utils/query';

export class DeleteItem extends Method implements Executable {

	private rawResult: boolean = false;

	constructor(table: Table, dynamodb: DynamoDB) {
		super(table, dynamodb);
	}

	/**
	 * Initialize the `DeleteItem` object.
	 *
	 * @param	query			The query for the index to filter on.
	 * @param	opts			Additional param options.
	 */
	initialize(query: any, opts?: {result: boolean}) {
		// Set the query as key
		this.params.Key = query;

		if (opts && opts.result === true) {
			this.params.ReturnValues = 'ALL_OLD';
		}

		// Return the object so that it can be chained
		return this;
	}

	/**
	 * Create a conditional delete item object where the condition should be satisfied in order for the item to be
	 * deleted.
	 *
	 * @param	condition		A condition that must be satisfied in order for a conditional DeleteItem to succeed.
	 */
	where(condition: any) {
		// Parse the query
		const parsedQuery = queryUtil.parse(condition, this.params.ExpressionAttributeValues);

		// Add the parsed query attributes to the correct properties of the params object
		this.params.ConditionExpression = parsedQuery.ConditionExpression;
		this.params.ExpressionAttributeNames = {...this.params.ExpressionAttributeNames, ...parsedQuery.ExpressionAttributeNames};
		this.params.ExpressionAttributeValues = {...this.params.ExpressionAttributeValues, ...parsedQuery.ExpressionAttributeValues};

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Returns the raw result.
	 */
	raw() {
		// Set the raw parameter to true.
		this.rawResult = true;

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): DeleteItemInput {
		return {
			...this.params,
			TableName: (this.table !).name
		} as DeleteItemInput;
	}

	/**
	 * This method will execute the delete item request that was built up.
	 */
	exec(): Promise<any> {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		return this.runQuery(() => db.delete(this.buildRawQuery()).promise())
			.then(data => {
				if (this.params.ReturnValues === 'ALL_OLD') {
					return this.rawResult === true ? data : data.Attributes;
				}

				return;
			});
	}
}
