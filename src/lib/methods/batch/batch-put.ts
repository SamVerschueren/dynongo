import { BatchItem } from './batch-item';

export class PutRequest extends BatchItem {

	constructor(props, key: any, private body: any) {
		super(props, key);
	}

	get value() {
		return {PutRequest: {Item: {...this.key, ...this.body}}};
	}
}
