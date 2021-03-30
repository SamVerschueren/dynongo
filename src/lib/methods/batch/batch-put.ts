import { BatchItem } from './batch-item';
import { BatchPutItem } from '../../types/interfaces';

export class PutRequest extends BatchItem {

	constructor(props, key: any, private body: any) {
		super(props, key);
	}

	buildRawQuery(): BatchPutItem  {
		return {PutRequest: {Item: {...this.key, ...this.body}}};
	}
}
