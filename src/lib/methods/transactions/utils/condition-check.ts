import { QueryInput, Converter, ConditionCheck } from 'aws-sdk/clients/dynamodb';
import { Query } from '../../query';
import { keyParser } from './key-parser';

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

	const result = keyParser(build);

	return {
		TableName: build.TableName,
		Key: Converter.marshall(result.Key),
		ConditionExpression: build.FilterExpression,
		ExpressionAttributeNames: result.AttributeNames,
		ExpressionAttributeValues: Converter.marshall(result.AttributeValues)
	};
};
