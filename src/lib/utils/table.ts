export function lookupName(name: string, dynamodb) {
	const nameArray = dynamodb.prefix ? [].concat(dynamodb.prefix) : [];
	nameArray.push(name);

	return nameArray.join(dynamodb.delimiter);
}
