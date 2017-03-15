import { Map } from '../types/map';

export interface KeyNameResult {
	Expression: string;
	ExpressionAttributeNames: Map<string>;
}

export interface ValueNameResult {
	Expression: string | string[];
	ExpressionAttributeValues: Map<any>;
};

const indexify = (key: string, value: any, values: any) => {
	if (values[key] && values[key] !== value) {
		let i = 1;

		while (values[`${key}_${i}`] && values[`${key}_${i}`] !== value) {
			++i;
		}

		key += `_${i}`;
	}

	return key;
};

/**
 * Parse a key to an expression statement that can be used directly in an expression and to an
 * object that maps the keyname to the original name.
 *
 * @param	key			The key that should be converted to a valid name
 */
export function generateKeyName(key: string): KeyNameResult {
	const tokens = key.split('.');
	const expression = [];

	const names = {};

	for (let token of tokens) {
		// Push the key to the expression list
		expression.push(`#k_${token}`);

		// Remove array indexes
		token = token.replace(/\[[0-9]+]/g, '');

		// Add the key with the keyvalue to the result
		names[`#k_${token}`] = token;
	}

	// Return the object
	return {
		Expression: expression.join('.'),
		ExpressionAttributeNames: names
	};
}

/**
 * Generates a unique name, based on the key, for the value provided.
 *
 * @param	key			The key that should be converted to a valid name
 * @param	value		The value associated with the key.
 * @param	values		The map of values already generated.
 * @param	raw			If set to true, it will handle the value as is and will not convert if it is an array.
 */
export function generateValueName(key: string, value: any, values?: {[key: string]: any}, raw?: boolean): ValueNameResult {
	if (value === undefined) {
		// Trow an error if the value is undefined
		throw new Error(`Value for key \`${key}\` is undefined. Please provide a valid value.`);
	}

	values = values || {};

	const valueKey = ':v_' + key.replace(/[^a-zA-Z0-9_]+/g, '_');
	let expression: any = [];
	const expressionValues = {};

	if (Array.isArray(value) && !raw) {
		for (let i = 0; i < value.length; i++) {
			const tempKey = indexify(`${valueKey}_${i}`, value, values);

			expression.push(tempKey);

			expressionValues[tempKey] = value[i];
		}
	} else {
		expression = indexify(valueKey, value, values);

		expressionValues[expression] = value;
	}

	return {
		Expression: expression,
		ExpressionAttributeValues: expressionValues
	};
}
