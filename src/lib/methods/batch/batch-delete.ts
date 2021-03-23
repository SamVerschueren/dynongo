import { BatchItem } from './batch-item';

export class DeleteRequest extends BatchItem {

	constructor(props, key: any) {
		super(props, key);
	}

	get value() {
		return {DeleteRequest: { Key: this.key}};
	}
}
