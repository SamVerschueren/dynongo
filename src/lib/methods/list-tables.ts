import { DynamoDB } from '../dynamodb';
import { Executable } from './executable';
import { Method } from './method';
import { ListTablesInput } from 'aws-sdk/clients/dynamodb';

export class ListTables extends Method implements Executable {

	constructor(dynamodb: DynamoDB) {
		super(null, dynamodb);
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): ListTablesInput {
		return {};
	}

	/**
	 * Execute the `ListTables` request.
	 */
	exec(): Promise<string[]> {
		if (!this.dynamodb.raw) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		return this.execHelper(this.buildRawQuery());
	}

	private execHelper(params: ListTablesInput, previousResult: string[] = []): Promise<string[]> {
		let result = previousResult;

		const db = this.dynamodb.raw !;
		const prefix = this.dynamodb.prefix;

		return db.listTables({}).promise()
			.then(data => {
				result = result.concat(data.TableNames || []);

				if (data.LastEvaluatedTableName) {
					params.ExclusiveStartTableName = data.LastEvaluatedTableName;

					return this.execHelper(params, result);
				}

				return prefix === undefined ? result : result.filter(table => table.indexOf(prefix) === 0);
			});
	}
}
