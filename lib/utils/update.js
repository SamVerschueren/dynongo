'use strict';

/**
 * Utility methods for update queries.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  20 Jul. 2015
 */

// module dependencies
var _ = require('lodash'),
    keyUtil = require('./key');

module.exports = {
    parse: function(query) {
        var names = {},
            values = {};
        
        var expr = {};
        
        if(query.$set) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$set, function(value, key) {
                var keyName = keyUtil.generate(key);
                
                names['#k_' + keyName] = key;
                values[':v_' + keyName] = value;
                
                return '#k_' + keyName + '=:v_' + keyName;
            }));
        }
        if(query.$unset) {
            expr.remove = expr.remove || []
            
            expr.remove = expr.remove.concat(_.map(query.$unset, function(value, key) {
                var keyName = keyUtil.generate(key);
                
                names['#k_' + keyName] = key;
                
                return '#k_' + keyName;
            }));
        }
        if(query.$inc) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$inc, function(value, key) {
                var keyName = keyUtil.generate(key);
                
                names['#k_' + keyName] = key;
                values[':v_' + keyName] = value;
                
                return '#k_' + keykeyName+ ' = #k_' + keyName + ' + :v_' + keyName;
            }));
        }
        if(query.$push) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$push, function(value, key) {
                var keyName = keyUtil.generate(key);
                
                names['#k_' + keyName] = key;
                values[':v_' + keyName] = value;
                
                return '#k_' + keyName + ' = list_append(#k_' + keyName + ', :v_' + keyName + ')';
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