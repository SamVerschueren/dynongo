'use strict';

/**
 * Utility methods for query objects.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  17 Jul. 2015
 */

// module dependencies
var _ = require('lodash');

module.exports = {
    parse: function(query) {
        var expression = [],
            names = {},
            values = {};
        
        _.forEach(query, function(value, key) {
            var operator = '=';
            
            if(_.isObject(value)) {
                var op = Object.keys(value)[0];
                
                value = value[op];
                
                switch(op) {
                    case '$eq':
                        operator = '=';
                        break;
                    case '$lt':
                        operator = '<';
                        break;
                    case '$lte':
                        operator = '<=';
                        break;
                    case '$gt':
                        operator = '>';
                        break;
                    case '$gte':
                        operator = '>=';
                        break;
                    case '$in':
                    case '$nin':
                        if(!Array.isArray(value)) {
                            // Throw an error if the value is not an array
                            throw new Error('Please provide an array of elements for the ' + op + ' operator.');
                        }
                        
                        // Store the key in the names array
                        names['#k_' + key] = key;
                        
                        // Build up the list that should be used as in argument
                        var tempList = value.map(function(v, index) {
                            var k = ':v_' + key + index;
                            
                            // Store the value with the correct key in the values map
                            values[k] = v;
                        
                            return k;
                        });
                        
                        // Prefix with not if the operator is $nin
                        var not = (op === '$nin' ? 'NOT ' : '');
                        
                        // Push the expression to the list of expressions
                        expression.push(not + '#k_' + key + ' IN (' + tempList.join(',') + ')');
                        return;
                    case '$contains':
                        // Push the key and value to the arrays
                        names['#k_' + key] = key;
                        values[':v_' + key] = value;
                        
                        // Push the contains expression
                        expression.push('contains(#k_' + key + ', :v_' + key + ')');
                        return;
                    case '$exists':
                        // Push the key to the names array
                        names['#k_' + key] = key;
                        
                        if(value === true || value === 1) {
                            // If the value is true or 1, check if attribute exists
                            expression.push('attribute_exists(#k_' + key + ')');
                        }
                        else {
                            // If the value is not true or not 1, check if attribute not exists
                            expression.push('attribute_not_exists(#k_' + key + ')');
                        }
                        return;
                }
            }
            
            expression.push('#k_' + key + operator + ':v_' + key);
            names['#k_' + key] = key;
            values[':v_' + key] = value;
        });
        
        return {
            ConditionExpression: expression.join(' AND '),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };
    }
};