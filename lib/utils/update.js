'use strict';

/**
 * Utility methods for update queries.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  20 Jul. 2015
 */

// module dependencies
var _ = require('lodash'),
    nameUtil = require('./name');

module.exports = {
    parse: function(query) {
        var names = {},
            values = {};
        
        var expr = {};
        
        if(query.$set) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$set, function(value, key) {
                var k = nameUtil.generateKeyName(key),
                    v = nameUtil.generateValueName(key, value, values);
                
                _.extend(names, k.ExpressionAttributeNames);
                _.extend(values, v.ExpressionAttributeValues);
                
                return k.Expression + ' = ' + v.Expression;
            }));
        }
        if(query.$unset) {
            expr.remove = expr.remove || []
            
            expr.remove = expr.remove.concat(_.map(query.$unset, function(value, key) {
                var k = nameUtil.generateKeyName(key);
                
                _.extend(names, k.ExpressionAttributeNames);
                
                return k.Expression
            }));
        }
        if(query.$inc) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$inc, function(value, key) {
                var k = nameUtil.generateKeyName(key),
                    v = nameUtil.generateValueName(key, value, values);
                
                _.extend(names, k.ExpressionAttributeNames);
                _.extend(values, v.ExpressionAttributeValues);
                
                return k.Expression + ' = ' + k.Expression + ' + ' + v.Expression;
            }));
        }
        if(query.$push) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$push, function(value, key) {
                var k = nameUtil.generateKeyName(key),
                    v = nameUtil.generateValueName(key, value, values);
                
                _.extend(names, k.ExpressionAttributeNames);
                _.extend(values, v.ExpressionAttributeValues);
                
                return k.Expression + ' = list_append(' + k.Expression + ', ' + v.Expression + ')';
            }));
        }
        
        var expression = _.map(expr, function(val, key) {
            return key.toUpperCase() + ' ' + val.join(', ');
        });
        
        return {
            UpdateExpression: expression.join(' '),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };
    }
};