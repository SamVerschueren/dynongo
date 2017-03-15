import { DynamoDB } from '../dynamodb';
import { Table } from '../table';
import { Params } from '../types/params';

export abstract class Method {

	protected params: Params = {};

	constructor(
		protected table: Table,
		protected dynamodb: DynamoDB
	) { }
}
