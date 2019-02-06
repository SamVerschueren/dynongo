import { QueryInput, Converter, ConditionCheck } from 'aws-sdk/clients/dynamodb';
import { Query } from '../../query';

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
 * Generate a transaction `ConditionCheck` based on a `Query`.
 *
 * @param	query			Query to generate the check.
 */
export const generateConditionCheck = (query: Query): ConditionCheck => {
	const build: QueryInput = query.buildRawQuery();

	if (!build.FilterExpression) {
		// A `ConditionCheck` requires a `FilterExpression`
		throw new Error('No `where` clause provided in transaction ConditionCheck');
	}

	const keyMap = generateKeyMap(build.KeyConditionExpression || '');

	const key = {};

	const attributeNames = {
		...build.ExpressionAttributeNames
	};

	const attributeValues = {
		...build.ExpressionAttributeValues
	};

	for (const [name, value] of keyMap) {
		const keyName = attributeNames[name];

		key[keyName] = attributeValues[value];

		delete attributeNames[name];
		delete attributeValues[value];
	}

	return {
		TableName: build.TableName,
		Key: Converter.marshall(key),
		ConditionExpression: build.FilterExpression,
		ExpressionAttributeNames: attributeNames,
		ExpressionAttributeValues: Converter.marshall(attributeValues)
	};
};
