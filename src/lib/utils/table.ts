import { DynamoDB } from '../dynamodb';

export function lookupName(name: string, dynamodb: DynamoDB) {
	const nameArray = dynamodb.prefix ? [dynamodb.prefix] : [];
	nameArray.push(name);

	return nameArray.join(dynamodb.delimiter);
}
