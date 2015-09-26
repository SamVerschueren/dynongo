'use strict';

/**
 * Utility methods for query objects.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var _ = require('lodash'),
    nameUtil = require('./name');

module.exports = {
    parse: function(query, values) {
        var self = this;

        var expressions = [],
            names = {};

        values = values || {};

        _.forEach(query, function(value, key) {
            var parsed;

            switch(key) {
                case '$or':
                    if(!Array.isArray(value)) {
                        // Throw an error if the value is not an array
                        throw new Error('Invalid expression $or. Value should be an array.');
                    }

                    parsed = self._parseArray(value, values, 'OR');
                    break;
                case '$and':
                    if(!Array.isArray(value)) {
                        // Throw an error if the value is not an array
                        throw new Error('Invalid expression $and. Value should be an array.');
                    }

                    parsed = self._parseArray(value, values, 'AND');
                    break;
                default:
                    parsed = self._parseExpression(key, value, values);
                    break;
            }

            expressions.push(parsed.ConditionExpression);

            _.extend(names, parsed.ExpressionAttributeNames);
            _.extend(values, parsed.ExpressionAttributeValues);
        });

        return {
            ConditionExpression: expressions.join(' AND '),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };
    },
    _parseArray: function(arr, values, join) {
        var self = this;

        var expressions = [],
            names = {};

        arr.forEach(function(subquery) {
            var o = self.parse(subquery, values);

            expressions.push(o.ConditionExpression);

            _.extend(names, o.ExpressionAttributeNames);
            _.extend(values, o.ExpressionAttributeValues);
        });

        return {
            ConditionExpression: '(' + expressions.join(' ' + join + ' ') + ')',
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };
    },
    _parseExpression: function(key, value, values) {
        var expression,
            k = nameUtil.generateKeyName(key),
            v;

        if(_.isObject(value)) {
            var op = Object.keys(value)[0];

            value = value[op];

            if (op === '$beginsWith') {
                // Parse value to string if the operator is $beginsWith
                value = value.toString();
            }

            v = nameUtil.generateValueName(key, value, values);

            switch(op) {
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
                    if(!Array.isArray(value)) {
                        // Throw an error if the value is not an array
                        throw new Error('Please provide an array of elements for the ' + op + ' operator.');
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

                    if(value === true || value === 1) {
                        // If the value is true or 1, check if attribute exists
                        expression = 'attribute_exists(' + k.Expression +  ')';
                    }
                    else {
                        // If the value is not true or not 1, check if attribute not exists
                        expression = 'attribute_not_exists(' + k.Expression +  ')';
                    }
                    break;
                case '$beginsWith':
                    expression = 'begins_with(' + k.Expression + ', ' + v.Expression + ')';
                    break;
            }
        }
        else {
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