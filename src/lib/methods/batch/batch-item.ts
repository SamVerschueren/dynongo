import { BatchDeleteItem, BatchPutItem } from '../../types/interfaces';

export abstract class BatchItem {

	protected constructor(public table: string, public key: any) {
	}

	abstract buildRawQuery(): BatchPutItem | BatchDeleteItem;
}
