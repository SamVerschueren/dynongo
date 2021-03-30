export interface BatchPutItem {
	PutRequest: {
		Item: {
			[key: string]: any;
		};
	};
}
export interface BatchDeleteItem {
	DeleteRequest: {
		Key: {
			[key: string]: any;
		};
	};
}
