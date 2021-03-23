import retry, { Options as RetryOptions } from 'p-retry';
import { Table } from '../table';
import { DynamoDB } from '../dynamodb';
import { configureRetryOptions, retryErrorHandler } from '../utils';
import { QueryBuilder } from '../types';

export abstract class BaseMethod implements QueryBuilder {

	protected retries?: number | RetryOptions;

	protected constructor(
		protected readonly table: Table | null,
		protected readonly dynamodb: DynamoDB
	) {}

	/**
	 * Configure the number of retries.
	 *
	 * @param retries - Number of retries
	 */
	retry(retries: number);
	/**
	 * Configure the retry policy.
	 *
	 * @param options - Retry configuration options.
	 */
	retry(options: RetryOptions);
	retry(retries: number | RetryOptions) {
		this.retries = retries;

		return this;
	}

	protected async runQuery<T>(operation: () => Promise<T>) {
		const retries = this.retries || this.dynamodb.retries;
		const retryOptions = configureRetryOptions(retries);
		return retries
			? retry(() => operation().catch(retryErrorHandler), retryOptions)
			: operation();
	}

	abstract buildRawQuery();
}
