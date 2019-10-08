import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { Params } from '../types';
import { QueryBuilder } from '../types/query-builder';

export abstract class Method implements QueryBuilder {

	protected params: Params = {};

	constructor(
		protected readonly table: Table | null,
		protected readonly dynamodb: DynamoDB
	) {}

	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	abstract buildRawQuery(): any;
}
