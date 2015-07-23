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
    parse: function(query) {
        var expression = [],
            names = {},
            values = {};
        
        _.forEach(query, function(value, key) {
            var k = nameUtil.generateKeyName(key),
                v;
            
            if(_.isObject(value)) {
                var op = Object.keys(value)[0];
                
                value = value[op];
                
                v = nameUtil.generateValueName(key, value, values);
                
                switch(op) {
                    case '$eq':
                        expression.push(k.Expression + '=' + v.Expression);
                        break;
                    case '$lt':
                        expression.push(k.Expression + '<' + v.Expression);
                        break;
                    case '$lte':
                        expression.push(k.Expression + '<=' + v.Expression);
                        break;
                    case '$gt':
                        expression.push(k.Expression + '>' + v.Expression);
                        break;
                    case '$gte':
                        expression.push(k.Expression + '>=' + v.Expression);
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
                        expression.push(not + k.Expression + ' IN (' + v.Expression.join(',') + ')');
                        break;
                    case '$contains':
                        // Push the contains expression
                        expression.push('contains(' + k.Expression + ', ' + v.Expression + ')');
                        break;
                    case '$exists':
                        if(value === true || value === 1) {
                            // If the value is true or 1, check if attribute exists
                            expression.push('attribute_exists(' + k.Expression +  ')');
                        }
                        else {
                            // If the value is not true or not 1, check if attribute not exists
                            expression.push('attribute_not_exists(' + k.Expression +  ')');
                        }
                        break;
                }
            }
            else {
                // Generate the value name
                v = nameUtil.generateValueName(key, value, values);
                
                // If the value is not an object, check for equality
                expression.push(k.Expression + ' = ' + v.Expression);
            }
            
            // Extend the names and the values with the calculated names and values
            _.extend(names, k.ExpressionAttributeNames);
            _.extend(values, v.ExpressionAttributeValues);
        });
        
        return {
            ConditionExpression: expression.join(' AND '),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };
    }
};