import { QueryInput } from 'aws-sdk/clients/dynamodb';

const generateKeyMap = (expression: string) => {
	const keyExtractRegex = /(#.*?)=(:.*?)(\s|$)/g;

	const result = new Map<string, string>();

	let match = keyExtractRegex.exec(expression);

	while (match !== null) {
		result.set(match[1], match[2]);

		match = keyExtractRegex.exec(expression);
	}

	return result;
};

/**
 * Parses the key out of the `KeyConditionExpression` and returns the key together with the adjusted attribute names and values.
 *
 * @param	query	Query that should be parsed.
 */
export const keyParser = (query: QueryInput) => {
	const keyMap = generateKeyMap(query.KeyConditionExpression || '');

	const key = {};

	const attributeNames = {
		...query.ExpressionAttributeNames
	};

	const attributeValues = {
		...query.ExpressionAttributeValues
	};

	for (const [name, value] of keyMap) {
		const keyName = attributeNames[name];

		key[keyName] = attributeValues[value];

		delete attributeNames[name];
		delete attributeValues[value];
	}

	return {
		Key: key,
		AttributeNames: attributeNames,
		AttributeValues: attributeValues
	};
};
