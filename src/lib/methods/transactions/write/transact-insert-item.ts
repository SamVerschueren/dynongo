import { TransactWriteItem, Converter } from 'aws-sdk/clients/dynamodb';
import { TransactMethod } from '../transact-method';
import { InsertItem } from '../../insert-item';

export class TransactInsertItem extends TransactMethod {
	constructor(
		private readonly query: InsertItem
	) {
		super();
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): TransactWriteItem {
		const result = this.query.buildRawQuery();

		return {
			Update: {
				TableName: result.TableName,
				Key: Converter.marshall(result.Key),
				ConditionExpression: result.ConditionExpression,
				UpdateExpression: result.UpdateExpression !,
				ExpressionAttributeNames: result.ExpressionAttributeNames,
				ExpressionAttributeValues: result.ExpressionAttributeValues ? Converter.marshall(result.ExpressionAttributeValues) : undefined
			}
		};
	}
}
