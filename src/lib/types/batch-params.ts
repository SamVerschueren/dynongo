import { BatchItem } from '../methods/batch';

export interface BatchParams {
	RequestItems?: {
		[TableName: string]: BatchItem[]
	};
}
