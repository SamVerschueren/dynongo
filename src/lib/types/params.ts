export interface Params {
	TableName?: string;
	IndexName?: string;
	Key?: {
		[key: string]: any
	};
	KeyConditionExpression?: string;
	FilterExpression?: string;
	UpdateExpression?: any;
	ConditionExpression?: string;
	ExpressionAttributeNames?: {
		[key: string]: string;
	};
	ExpressionAttributeValues?: {
		[key: string]: any;
	};
	ProjectionExpression?: string;
	ScanIndexForward?: boolean;
	ExclusiveStartKey?: any;
	Limit?: number;
	ReturnValues?: 'ALL_NEW' | 'ALL_OLD';
	Select?: 'COUNT';
}
