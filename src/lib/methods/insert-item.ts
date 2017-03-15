import * as pify from 'pify';
import * as queryUtil from '../utils/query';
import * as updateUtil from '../utils/update';
import { Executable } from './executable';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { Params } from '../types/params';
import { UpdateQuery } from '../types/update-query';

export class InsertItem implements Executable {

	protected rawResult: boolean;
	protected params: Params = {
		ReturnValues: 'ALL_NEW'
	};

	constructor(
		protected table: Table,
		protected dynamodb: DynamoDB
	) { }

	/**
	 * Initialize the `InsertItem` object.
	 *
	 * @param	query			The key of the item to insert.
	 * @param	data			The insert data object.
	 */
	initialize(query: any, data: UpdateQuery) {
		// Set the query as key
		this.params.Key = query;

		// Parse the data
		const parsedData = updateUtil.parse(data);

		// Append the attributes to the correct properties
		this.params.UpdateExpression = parsedData.UpdateExpression;
		this.params.ExpressionAttributeNames = Object.assign({}, this.params.ExpressionAttributeNames, parsedData.ExpressionAttributeNames);
		this.params.ExpressionAttributeValues = Object.assign({}, this.params.ExpressionAttributeValues, parsedData.ExpressionAttributeValues);

		// Return the object so that it can be chained
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
	 * Execute the insert item request.
	 */
	exec() {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		if (this.params.UpdateExpression === '') {
			delete this.params.UpdateExpression;
		}

		// Parse the query to add a negated condition expression https://github.com/SamVerschueren/dynongo/issues/3
		const parsedQuery = queryUtil.parse(this.params.Key);

		const params = this.params;
		params.TableName = this.table.name;
		params.ConditionExpression = `NOT (${parsedQuery.ConditionExpression})`;
		params.ExpressionAttributeNames = Object.assign({}, params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
		params.ExpressionAttributeValues = Object.assign({}, params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

		return pify(db.update.bind(db))(params)
			.then(data => {
				// Return the attributes
				return this.rawResult === true ? data : data.Attributes;
			})
			.catch(err => {
				if (err.code === 'ConditionalCheckFailedException') {
					err.message = 'Duplicate key! A record with key `' + JSON.stringify(params.Key) + '` already exists.';
				}

				throw err;
			});
	};
}
