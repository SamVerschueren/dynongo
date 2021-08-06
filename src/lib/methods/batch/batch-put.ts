import { BatchItem } from './batch-item';
import { BatchPutItem } from '../../types/interfaces';

export class PutRequest<K> extends BatchItem {

	constructor(props, key: K, private body: any) {
		super(props, key);
	}

	buildRawQuery(): BatchPutItem  {
		return {PutRequest: {Item: {...this.key, ...this.body}}};
	}
}
