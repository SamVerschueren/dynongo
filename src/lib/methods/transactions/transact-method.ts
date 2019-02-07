import { QueryBuilder } from '../../types/query-builder';

export abstract class TransactMethod implements QueryBuilder {
	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	abstract buildRawQuery(): any;
}
