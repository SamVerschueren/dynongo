import retry, { Options as RetryOptions } from 'p-retry';
import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { Params } from '../types';
import { QueryBuilder } from '../types/query-builder';
import { retryErrorHandler, configureRetryOptions } from '../utils';

export abstract class Method implements QueryBuilder {

	protected params: Params = {};
	protected retries?: number | RetryOptions;

	constructor(
		protected readonly table: Table | null,
		protected readonly dynamodb: DynamoDB
	) {}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	abstract buildRawQuery(): any;
	/**
	 * Configure the number of retries.
	 *
	 * @param retries - Number of retries
	 */
	retry(retries: number);
	/**
	 * Configure the retry policy.
	 *
	 * @param retries - Retry configuration options.
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
}
