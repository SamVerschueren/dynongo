import DynamoDBSet from 'aws-sdk/lib/dynamodb/set';
import { Map, UpdateQuery } from '../types';
import * as nameUtil from './name';

interface ParseResult {
	UpdateExpression: string;
	ExpressionAttributeNames: Map<string>;
	ExpressionAttributeValues: Map<any>;
}

export const operators = ['$set', '$unset', '$inc', '$push', '$unshift', '$addToSet'];

const fromArrayEach = (value, allowArrayInArray = true) => {
	if (value.$each) {
		if (!Array.isArray(value.$each)) {
			throw new Error('The value for $each should be an array.');
		}

		return value.$each;
	}

	if (allowArrayInArray) {
		return [value];
	}

	return Array.isArray(value) ? value : [value];
};

export function parse<D>(query: UpdateQuery<D>): ParseResult {
	const names = {};
	const values = {};

	const expr: any = {};

	if (query.$set) {
		expr.set = expr.set || [];

		expr.set = expr.set.concat(Object.keys(query.$set).map(key => {
			const value = (query.$set!)[key];
			if (value?.$ifNotExists) {
				const k = nameUtil.generateKeyName(key);
				const v = nameUtil.generateValueName(key, value.$ifNotExists, values, true);

				Object.assign(names, k.ExpressionAttributeNames);
				Object.assign(values, v.ExpressionAttributeValues);

				return k.Expression + '=if_not_exists(' + k.Expression + ', ' + v.Expression + ')';
			}

			const k = nameUtil.generateKeyName(key);
			const v = nameUtil.generateValueName(key, value, values, true);

			Object.assign(names, k.ExpressionAttributeNames);
			Object.assign(values, v.ExpressionAttributeValues);

			return k.Expression + '=' + v.Expression;
		}));
	}
	if (query.$unset) {
		expr.remove = expr.remove || [];

		expr.remove = expr.remove.concat(Object.keys(query.$unset).map(key => {
			const k = nameUtil.generateKeyName(key);

			Object.assign(names, k.ExpressionAttributeNames);

			return k.Expression;
		}));
	}
	if (query.$inc) {
		expr.add = expr.add || [];

		expr.add = expr.add.concat(Object.keys(query.$inc).map(key => {
			const value = (query.$inc!)[key];

			const k = nameUtil.generateKeyName(key);
			const v = nameUtil.generateValueName(key, value, values);

			Object.assign(names, k.ExpressionAttributeNames);
			Object.assign(values, v.ExpressionAttributeValues);

			return `${k.Expression} ${v.Expression}`;
		}));
	}
	if (query.$push || query.$unshift) {
		expr.set = expr.set || [];

		const operator = query.$push ? '$push' : '$unshift';

		expr.set = expr.set.concat(Object.keys(query[operator]!).map(key => {
			const value = fromArrayEach((query[operator]!)[key]);
			const k = nameUtil.generateKeyName(key);
			const v = nameUtil.generateValueName(key, value, values, true);
			v.ExpressionAttributeValues[':_v_empty_list'] = [];

			Object.assign(names, k.ExpressionAttributeNames);
			Object.assign(values, v.ExpressionAttributeValues);

			// Use if_not_exists to solve failure if property does not exist https://github.com/SamVerschueren/dynongo/issues/29
			let args = `if_not_exists(${k.Expression}, :_v_empty_list), ${v.Expression}`;

			if (operator === '$unshift') {
				args = `${v.Expression}, if_not_exists(${k.Expression}, :_v_empty_list)`;
			}

			return k.Expression + '=list_append(' + args + ')';
		}));
	}

	if (query.$addToSet) {
		expr.add = expr.add || [];

		expr.add = expr.add.concat(Object.keys(query.$addToSet).map(key => {
			const value = fromArrayEach(query.$addToSet![key], false);
			const dynamoDBSet = new DynamoDBSet(value);
			const k = nameUtil.generateKeyName(key);
			const v = nameUtil.generateValueName(key, dynamoDBSet, values, true);

			Object.assign(names, k.ExpressionAttributeNames);
			Object.assign(values, v.ExpressionAttributeValues);

			return `${k.Expression} ${v.Expression}`;
		}));
	}

	if (query.$removeFromSet) {
		expr.delete = expr.delete || [];

		expr.delete = expr.delete.concat(Object.keys(query.$removeFromSet).map(key => {
			const value = fromArrayEach(query.$removeFromSet![key], false);
			const dynamoDBSet = new DynamoDBSet(value);
			const k = nameUtil.generateKeyName(key);
			const v = nameUtil.generateValueName(key, dynamoDBSet, values, true);

			Object.assign(names, k.ExpressionAttributeNames);
			Object.assign(values, v.ExpressionAttributeValues);

			return `${k.Expression} ${v.Expression}`;
		}));
	}

	const expression = Object.keys(expr).map(key => {
		if (expr[key].length === 0) {
			return undefined;
		}

		return key.toUpperCase() + ' ' + expr[key].join(', ');
	});

	return {
		UpdateExpression: expression.filter(Boolean).join(' '),
		ExpressionAttributeNames: names,
		ExpressionAttributeValues: values
	};
}
