import * as pify from 'pify';
import { DynamoDB } from '../dynamodb';
import { Executable } from './executable';

export class ListTables implements Executable {

	constructor(private dynamodb: DynamoDB) { }

	/**
	 * Execute the `ListTables` request.
	 */
	exec() {
		if (!this.dynamodb.raw) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		return this.execHelper();
	}

	private execHelper(result?: string[], params?: any): Promise<string[]> {
		result = result || [];
		params = params || {};

		const db = this.dynamodb.raw;
		const prefix = this.dynamodb.prefix;

		return pify(db.listTables.bind(db))(params)
			.then(data => {
				result = result.concat(data.TableNames);

				if (data.LastEvaluatedTableName) {
					params.ExclusiveStartTableName = data.LastEvaluatedTableName;
					return this.execHelper(result, params);
				}

				return prefix === undefined ? result : result.filter(table => table.indexOf(prefix) === 0);
			});
	}
}
