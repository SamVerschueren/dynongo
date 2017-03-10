'use strict';

/**
 * Utility methods for update queries.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  20 Jul. 2015
 */

// module dependencies
var objectAssign = require('object-assign');
var nameUtil = require('./name');

module.exports = {
	parse: function (query) {
		var names = {};
		var values = {};

		var expr = {};

		if (query.$set) {
			expr.set = expr.set || [];

			expr.set = expr.set.concat(Object.keys(query.$set).map(function (key) {
				var value = query.$set[key];

				var k = nameUtil.generateKeyName(key);
				var v = nameUtil.generateValueName(key, value, values, true);

				objectAssign(names, k.ExpressionAttributeNames);
				objectAssign(values, v.ExpressionAttributeValues);

				return k.Expression + '=' + v.Expression;
			}));
		}
		if (query.$unset) {
			expr.remove = expr.remove || [];

			expr.remove = expr.remove.concat(Object.keys(query.$unset).map(function (key) {
				var k = nameUtil.generateKeyName(key);

				objectAssign(names, k.ExpressionAttributeNames);

				return k.Expression;
			}));
		}
		if (query.$inc) {
			expr.set = expr.set || [];

			expr.set = expr.set.concat(Object.keys(query.$inc).map(function (key) {
				var value = query.$inc[key];

				var k = nameUtil.generateKeyName(key);
				var v = nameUtil.generateValueName(key, value, values);

				objectAssign(names, k.ExpressionAttributeNames);
				objectAssign(values, v.ExpressionAttributeValues);

				return k.Expression + '=' + k.Expression + '+' + v.Expression;
			}));
		}
		if (query.$push || query.$unshift) {
			expr.set = expr.set || [];

			var operator = query.$push ? '$push' : '$unshift';

			expr.set = expr.set.concat(Object.keys(query[operator]).map(function (key) {
				var value = query[operator][key];

				if (value.$each) {
					value = value.$each;

					if (!Array.isArray(value)) {
						throw new Error('The value for $each should be an array.');
					}
				} else {
					value = [value];
				}

				var k = nameUtil.generateKeyName(key);
				var v = nameUtil.generateValueName(key, value, values, true);
				v.ExpressionAttributeValues[':_v_empty_list'] = [];

				objectAssign(names, k.ExpressionAttributeNames);
				objectAssign(values, v.ExpressionAttributeValues);

				// Use if_not_exists to solve failure if property does not exist https://github.com/SamVerschueren/dynongo/issues/29
				var args = 'if_not_exists(' + k.Expression + ', :_v_empty_list), ' + v.Expression;

				if (operator === '$unshift') {
					args = v.Expression + ', if_not_exists(' + k.Expression + ', :_v_empty_list)';
				}

				return k.Expression + '=list_append(' + args + ')';
			}));
		}

		var expression = Object.keys(expr).map(function (key) {
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
};
