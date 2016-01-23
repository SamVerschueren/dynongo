'use strict';

/**
 * Utility methods for query objects.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var objectAssign = require('object-assign');
var isObject = require('is-object');
var nameUtil = require('./name');

module.exports = {
	parse: function (query, values) {
		var self = this;

		var expressions = [];
		var names = {};
		var keys = Object.keys(query);

		values = values || {};

		keys.forEach(function (key) {
			var value = query[key];
			var parsed;

			switch (key) {
				case '$or':
					if (!Array.isArray(value)) {
						// Throw an error if the value is not an array
						throw new Error('Invalid expression $or. Value should be an array.');
					}

					parsed = self._parseArray(value, values, 'OR', keys.length > 1);
					break;
				case '$and':
					if (!Array.isArray(value)) {
						// Throw an error if the value is not an array
						throw new Error('Invalid expression $and. Value should be an array.');
					}

					parsed = self._parseArray(value, values, 'AND', keys.length > 1);
					break;
				default:
					parsed = self._parseExpression(key, value, values);
					break;
			}

			expressions.push(parsed.ConditionExpression);

			objectAssign(names, parsed.ExpressionAttributeNames);
			objectAssign(values, parsed.ExpressionAttributeValues);
		});

		return {
			ConditionExpression: expressions.join(' AND '),
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values
		};
	},
	_parseArray: function (arr, values, join, brackets) {
		var self = this;

		var expressions = [];
		var names = {};

		arr.forEach(function (subquery) {
			var o = self.parse(subquery, values);

			expressions.push(o.ConditionExpression);

			objectAssign(names, o.ExpressionAttributeNames);
			objectAssign(values, o.ExpressionAttributeValues);
		});

		var start = brackets ? '(' : '';
		var end = brackets ? ')' : '';

		return {
			ConditionExpression: start + expressions.join(' ' + join + ' ') + end,
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values
		};
	},
	_parseExpression: function (key, value, values) {
		var k = nameUtil.generateKeyName(key);
		var expression;
		var v;

		if (isObject(value)) {
			var op = Object.keys(value)[0];

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
					var not = (op === '$nin' ? 'NOT ' : '');

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
	}
};
