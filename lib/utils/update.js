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

				return k.Expression + ' = ' + v.Expression;
			}));
		}
		if (query.$unset) {
			expr.remove = expr.remove || [];

			expr.remove = expr.remove.concat(Object.keys(query.$unset)(function (key) {
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

				return k.Expression + ' = ' + k.Expression + ' + ' + v.Expression;
			}));
		}
		if (query.$push) {
			expr.set = expr.set || [];

			expr.set = expr.set.concat(Object.keys(query.$push).map(function (key) {
				var value = query.$push[key];

				var k = nameUtil.generateKeyName(key);
				var v = nameUtil.generateValueName(key, value, values);

				objectAssign(names, k.ExpressionAttributeNames);
				objectAssign(values, v.ExpressionAttributeValues);

				return k.Expression + ' = list_append(' + k.Expression + ', ' + v.Expression + ')';
			}));
		}

		var expression = Object.keys(expr).map(function (key) {
			return key.toUpperCase() + ' ' + expr[key].join(', ');
		});

		return {
			UpdateExpression: expression.join(' '),
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values
		};
	}
};
