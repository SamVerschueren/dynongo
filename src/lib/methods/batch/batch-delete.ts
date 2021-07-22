import { BatchItem } from './batch-item';
import { BatchDeleteItem } from '../../types/interfaces';

export class DeleteRequest<K> extends BatchItem {

	constructor(props, key: K) {
		super(props, key);
	}

	buildRawQuery(): BatchDeleteItem {
		return {DeleteRequest: { Key: this.key}};
	}
}
