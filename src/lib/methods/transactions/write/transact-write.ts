import { TransactWriteItemsInput, TransactWriteItem } from 'aws-sdk/clients/dynamodb';
import { Method } from '../../method';
import { Executable } from '../../executable';
import { DynamoDB } from '../../../dynamodb';
import { InsertItem } from '../../insert-item';
import { UpdateItem } from '../../update-item';
import { DeleteItem } from '../../delete-item';
import { TransactUpdateItem } from './transact-update-item';
import { TransactDeleteItem } from './transact-delete-item';
import { TransactInsertItem } from './transact-insert-item';
import { Query } from '../../query';
import { generateConditionCheck } from '../utils/condition-check';

export type WriteItem = InsertItem | UpdateItem | DeleteItem;

export class TransactWrite extends Method  implements Executable {

	private conditions: Query[] = [];

	constructor(
		dynamodb: DynamoDB,
		private readonly actions: WriteItem[]
	) {
		super(null, dynamodb);
	}

	/**
	 * Apply conditions to an item that is not being modified by the transaction.
	 *
	 * @param	query	List of query conditions.
	 */
	withConditions(...query: Query[]): this {
		this.conditions = query;

		return this;
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): TransactWriteItemsInput {
		const items = this.actions.map(action => {
			if (action instanceof UpdateItem) {
				return new TransactUpdateItem(action);
			}

			if (action instanceof InsertItem) {
				return new TransactInsertItem(action);
			}

			if (action instanceof DeleteItem) {
				return new TransactDeleteItem(action);
			}

			throw new Error('Unknown TransactWrite action provided');
		});

		const conditions = this.conditions.map<TransactWriteItem>(condition => {
			return {
				ConditionCheck: generateConditionCheck(condition)
			};
		});

		return {
			TransactItems: [
				...conditions,
				...items.map(item => item.buildRawQuery())
			]
		};
	}

	/**
	 * Execute the write transaction.
	 */
	async exec(): Promise<void> {
		const db = this.dynamodb.raw !;

		const query = this.buildRawQuery();

		if (query.TransactItems.length > 25) {
			throw new Error(`Number of transaction items should be less than or equal to \`25\`, got \`${query.TransactItems.length}\``);
		}

		const request = db.transactWriteItems(query);

		return new Promise((resolve, reject) => {
			let cancellationReasons;

			request.on('extractError', (response) => {
				try {
					cancellationReasons = JSON.parse(response.httpResponse.body.toString()).CancellationReasons;
				} catch (err) {
					// If for some reason we can't parse the error, we still want everything to work
					console.error('Error extracting cancellation error', err);
				}
			});

			request.send((err) => {
				if (err) {
					if (cancellationReasons) {
						(err as any).cancellationReasons = cancellationReasons;
					}

					return reject(err);
				}

				return resolve();
			});
		});
	}
}
