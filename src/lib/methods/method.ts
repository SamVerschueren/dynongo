import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { Params } from '../types/params';

export abstract class Method {

	protected params: Params = {};

	constructor(
		protected readonly table: Table | null,
		protected readonly dynamodb: DynamoDB
	) { }
}
