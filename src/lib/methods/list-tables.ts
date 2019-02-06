import { DynamoDB } from '../dynamodb';
import { Executable } from './executable';
import { Method } from './method';

export class ListTables extends Method implements Executable {

	constructor(dynamodb: DynamoDB) {
		super(null, dynamodb);
	}

	/**
	 * Execute the `ListTables` request.
	 */
	exec(): Promise<string[]> {
		if (!this.dynamodb.raw) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		return this.execHelper();
	}

	private execHelper(previousResult: string[] = [], params: any = {}): Promise<string[]> {
		let result = previousResult || [];

		const db = this.dynamodb.raw !;
		const prefix = this.dynamodb.prefix;

		return db.listTables(params).promise()
			.then(data => {
				result = result.concat(data.TableNames || []);

				if (data.LastEvaluatedTableName) {
					params.ExclusiveStartTableName = data.LastEvaluatedTableName;

					return this.execHelper(result, params);
				}

				return prefix === undefined ? result : result.filter(table => table.indexOf(prefix) === 0);
			});
	}
}
