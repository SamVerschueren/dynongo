import { BaseMethod } from '../base-method';
import { DynamoDB } from '../../dynamodb';

export abstract class BatchMethod extends BaseMethod {

	protected constructor(dynamodb: DynamoDB) {
		super(null, dynamodb);
	}
}
