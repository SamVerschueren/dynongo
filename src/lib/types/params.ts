import { Map } from './map';

export interface Params {
	TableName?: string;
	IndexName?: string;
	Key?: Map<any>;
	KeyConditionExpression?: string;
	FilterExpression?: string;
	UpdateExpression?: any;
	ConditionExpression?: string;
	ExpressionAttributeNames?: Map<string>;
	ExpressionAttributeValues?: Map<any>;
	ProjectionExpression?: string;
	ScanIndexForward?: boolean;
	ExclusiveStartKey?: any;
	Limit?: number;
	ReturnValues?: 'ALL_NEW' | 'ALL_OLD';
	Select?: 'COUNT';
};
