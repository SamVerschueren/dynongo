import isObject from 'is-object';
import * as nameUtil from './name';
import { Map } from '../types';

interface ParseResult {
	ConditionExpression: string;
	ExpressionAttributeNames: Map<string>;
	ExpressionAttributeValues: Map<any>;
}

const parseArray = (arr, values, join, brackets: boolean) => {
	const expressions: string[] = [];
	const names = {};

	for (const subquery of arr) {
		const o = parse(subquery, values);

		expressions.push(o.ConditionExpression);

		Object.assign(names, o.ExpressionAttributeNames);
		Object.assign(values, o.ExpressionAttributeValues);
	}

	const start = brackets ? '(' : '';
	const end = brackets ? ')' : '';

	return {
		ConditionExpression: start + expressions.join(` ${join} `) + end,
		ExpressionAttributeNames: names,
		ExpressionAttributeValues: values
	};
};

const parseExpression = (key: string, value: any, values: {[key: string]: any}) => {
	const k = nameUtil.generateKeyName(key);
	let expression;
	let v;

	if (isObject(value)) {
		const op = Object.keys(value)[0];

		value = value[op];

		if (value !== undefined && op === '$beginsWith') {
			// Parse value to string if the operator is $beginsWith
			value = value.toString();
		}

		v = nameUtil.generateValueName(key, value, values);

		switch (op) {
			case '$eq':
				expression = k.Expression + '=' + v.Expression;
				break;
			case '$lt':
				expression = k.Expression + '<' + v.Expression;
				break;
			case '$lte':
				expression = k.Expression + '<=' + v.Expression;
				break;
			case '$gt':
				expression = k.Expression + '>' + v.Expression;
				break;
			case '$gte':
				expression = k.Expression + '>=' + v.Expression;
				break;
			case '$not':
				if (isObject(value)) {
					const parsed = parseExpression(key, value, values);

					expression = 'NOT ' + parsed.ConditionExpression;
					k.ExpressionAttributeNames = parsed.ExpressionAttributeNames;
					v.ExpressionAttributeValues = parsed.ExpressionAttributeValues;
				} else {
					expression = 'NOT ' + k.Expression + '=' + v.Expression;
				}
				break;
			case '$in':
			case '$nin':
				if (!Array.isArray(value)) {
					// Throw an error if the value is not an array
					throw new Error('Please provide an array of elements for key `' + key + '`.');
				}

				if (value.length === 0) {
					// Throw an error if the array is empty
					throw new Error('Do not provide an empty list of elements for key `' + key + '`.');
				}

				// Prefix with not if the operator is $nin
				const not = (op === '$nin' ? 'NOT ' : '');

				// Push the expression to the list of expressions
				expression = not + k.Expression + ' IN (' + v.Expression.join(',') + ')';
				break;
			case '$contains':
				// Push the contains expression
				expression = 'contains(' + k.Expression + ', ' + v.Expression + ')';
				break;
			case '$exists':
				// Clear the values
				v.ExpressionAttributeValues = {};

				if (value === true || value === 1) {
					// If the value is true or 1, check if attribute exists
					expression = 'attribute_exists(' + k.Expression + ')';
				} else {
					// If the value is not true or not 1, check if attribute not exists
					expression = 'attribute_not_exists(' + k.Expression + ')';
				}
				break;
			case '$beginsWith':
				expression = 'begins_with(' + k.Expression + ', ' + v.Expression + ')';
				break;
			case '$between':
				if (!Array.isArray(value)) {
					throw new TypeError(`$between value for key \`${key}\` should be an array, got \`${typeof value}\``);
				}

				if (value.length !== 2) {
					throw new Error(`$between value for key \`${key}\` should have an exact length of \`2\`, got a length of \`${value.length}\``);
				}

				expression = `${k.Expression} BETWEEN ${v.Expression[0]} AND ${v.Expression[1]}`;
				break;
			default:
				throw new Error('Unknown operator ' + op);
		}
	} else {
		// Generate the value name
		v = nameUtil.generateValueName(key, value, values);

		// If the value is not an object, check for equality
		expression = k.Expression + '=' + v.Expression;
	}

	return {
		ConditionExpression: expression,
		ExpressionAttributeNames: k.ExpressionAttributeNames,
		ExpressionAttributeValues: v.ExpressionAttributeValues
	};
};

export function parse(query: {$or?: any[], $and?: any[], [key: string]: any}, values?: any): ParseResult {
	const expressions: string[] = [];
	const names = {};
	const keys = Object.keys(query);

	values = values || {};

	for (const key of keys) {
		const value = query[key];
		let parsed;

		switch (key) {
			case '$or':
				if (!Array.isArray(value)) {
					// Throw an error if the value is not an array
					throw new Error('Invalid expression $or. Value should be an array.');
				}

				parsed = parseArray(value, values, 'OR', keys.length > 1);
				break;
			case '$and':
				if (!Array.isArray(value)) {
					// Throw an error if the value is not an array
					throw new Error('Invalid expression $and. Value should be an array.');
				}

				parsed = parseArray(value, values, 'AND', keys.length > 1);
				break;
			default:
				parsed = parseExpression(key, value, values);
				break;
		}

		expressions.push(parsed.ConditionExpression);

		Object.assign(names, parsed.ExpressionAttributeNames);
		Object.assign(values, parsed.ExpressionAttributeValues);
	}

	return {
		ConditionExpression: expressions.join(' AND '),
		ExpressionAttributeNames: names,
		ExpressionAttributeValues: values
	};
}
