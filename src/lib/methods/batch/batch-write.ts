import { BatchWriteItemInput } from 'aws-sdk/clients/dynamodb';
import { Executable } from '../executable';
import { DynamoDB } from '../../dynamodb';
import { BatchItem } from './batch-item';
import { BatchMethod } from './batch-method';
import { UnprocessedItemsException } from '../../errors/UnprocessedItems';

export class BatchWrite extends BatchMethod implements Executable {

	constructor(
		dynamodb: DynamoDB,
		private items: BatchItem[]) {
		super(dynamodb);
	}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): BatchWriteItemInput {
		const request = {
			RequestItems: {}
		};

		for (const item of this.items) {
			const table = request.RequestItems[item.table];
			if (!table) {
				request.RequestItems[item.table] = [item.buildRawQuery()];
			} else {
				(request.RequestItems[item.table] as any[]).push(item.buildRawQuery());
			}
		}
		return request;
	}
	/**
	 * Execute the batch write request.
	 */
	exec(): Promise<any> {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		if (this.items.length < 1) {
			return Promise.reject(new Error('Items can not be empty.'));
		}

		if (this.items.length > 25) {
			return Promise.reject(new Error('Can not insert more than 25 items at a time.'));
		}

		if (!this.items) {
			return Promise.reject(new Error('params object was undefined.'));
		}

		let query = this.buildRawQuery();
		return this.runQuery(async () => {
			const {UnprocessedItems} = await db.batchWrite(query).promise();
			if (UnprocessedItems && Object.keys(UnprocessedItems).length > 0) {
				query = {RequestItems: UnprocessedItems};
				throw new UnprocessedItemsException(`${Object.keys(UnprocessedItems).length} could not be processed`);
			}
		});
	}
}
