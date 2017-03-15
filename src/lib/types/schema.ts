export interface ThroughPut {
	ReadCapacityUnits: number;
	WriteCapacityUnits: number;
}

export interface AttributeDefinition {
	AttributeName: string;
	AttributeType: string;
}

export interface KeySchema {
	AttributeName: string;
	KeyType: 'HASH' | 'RANGE';
}

export interface Projection {
	NonKeyAttributes: string[];
	ProjectionType: 'KEYS_ONLY' | 'INCLUDE' | 'ALL';
}

export interface GlobalSecondaryIndex {
	IndexName: string;
	KeySchema: KeySchema[];
	Projection: Projection;
	ProvisionedThroughput: ThroughPut;
}

export interface LocalSecondaryIndex {
	IndexName: string;
	KeySchema: KeySchema[];
	Projection: Projection;
}

export interface Schema {
	TableName: string;
	AttributeDefinitions: AttributeDefinition[];
	KeySchema: KeySchema[];
	GlobalSecondaryIndexes?: GlobalSecondaryIndex[];
	LocalSecondaryIndexes?: LocalSecondaryIndex[];
	ProvisionedThroughput: ThroughPut;
	StreamSpecification?: {
		StreamEnabled: boolean;
		StreamViewType: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES'
	};
}
