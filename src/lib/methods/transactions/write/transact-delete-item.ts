import { TransactWriteItem, Converter } from 'aws-sdk/clients/dynamodb';
import { TransactMethod } from '../transact-method';
import { DeleteItem } from '../../delete-item';

export class TransactDeleteItem<K = any, D = any> extends TransactMethod {

	constructor(
		private readonly query: DeleteItem<K, D>
	) {
		super();
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): TransactWriteItem {
		const result = this.query.buildRawQuery();

		return {
			Delete: {
				TableName: result.TableName,
				Key: Converter.marshall(result.Key),
				ConditionExpression: result.ConditionExpression,
				ExpressionAttributeNames: result.ExpressionAttributeNames,
				ExpressionAttributeValues: result.ExpressionAttributeValues ? Converter.marshall(result.ExpressionAttributeValues) : undefined
			}
		};
	}
}
