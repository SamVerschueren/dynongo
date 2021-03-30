import { BatchItem } from './batch-item';
import { BatchDeleteItem } from '../../types/interfaces';

export class DeleteRequest extends BatchItem {

	constructor(props, key: any) {
		super(props, key);
	}

	buildRawQuery(): BatchDeleteItem {
		return {DeleteRequest: { Key: this.key}};
	}
}
