import { TransactGetItemsInput, Converter } from 'aws-sdk/clients/dynamodb';
import { Method } from '../../method';
import { Executable } from '../../executable';
import { DynamoDB } from '../../../dynamodb';
import { Query } from '../../query';
import { TransactQuery } from './transact-query';

export type ReadItem<K, D> = Query<K, D>;

export class TransactRead<K, D> extends Method  implements Executable {

	constructor(
		dynamodb: DynamoDB,
		private readonly actions: ReadItem<K, D>[]
	) {
		super(null, dynamodb);
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): TransactGetItemsInput {
		const items = this.actions.map(action => {
			if (action instanceof Query) {
				return new TransactQuery(action);
			}

			throw new Error('Unknown TransactRead action provided');
		});

		return {
			TransactItems: [
				...items.map(item => item.buildRawQuery())
			]
		};
	}

	/**
	 * Execute the get transaction.
	 */
	async exec(): Promise<any[]> {
		const db = this.dynamodb.raw !;

		const query = this.buildRawQuery();

		if (query.TransactItems.length > 25) {
			throw new Error(`Number of transaction items should be less than or equal to \`25\`, got \`${query.TransactItems.length}\``);
		}

		const result = await db.transactGetItems(query).promise();

		return (result.Responses || []).map(response => response.Item ? Converter.unmarshall(response.Item) : undefined);
	}
}
