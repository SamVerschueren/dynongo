import { BaseMethod } from '../base-method';
import { DynamoDB } from '../../dynamodb';
import { BatchParams } from '../../types';

export abstract class BatchMethod extends BaseMethod {

	protected params: BatchParams = {};

	protected constructor(dynamodb: DynamoDB) {
		super(null, dynamodb);
	}
}
