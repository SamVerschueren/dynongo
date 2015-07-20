'use strict';

/**
 * Utility methods for update queries.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  20 Jul. 2015
 */

// module dependencies
var _ = require('lodash');

module.exports = {
    parse: function(query) {
        var names = {},
            values = {};
        
        var expr = {};
        
        if(query.$set) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$set, function(value, key) {
                names['#k_' + key] = key;
                values[':v_' + key] = value;
                
                return '#k_' + key + '=:v_' + key;
            }));
        }
        if(query.$unset) {
            expr.remove = expr.remove || []
            
            expr.remove = expr.remove.concat(_.map(query.$unset, function(value, key) {
                names['#k_' + key] = key;
                
                return '#k_' + key;
            }));
            
            expression.push('REMOVE ' + unsets.join(', '));
        }
        if(query.$inc) {
            expr.set = expr.set || [];
            
            expr.set = expr.set.concat(_.map(query.$inc, function(value, key) {
                names['#k_' + key] = key;
                values[':v_' + key] = value;
                
                return '#k_' + key + ' = #k_' + key + ' + :v_' + key;
            }));
        }
        // if(query.$push) {
        //     expr.add = expr.add || [];
            
        //     expr.add = expr.add.concat(_.map(query.$push, function(value, key) {
        //         names['#k_' + key] = key;
        //         values[':v_' + key] = value;
                
        //         return '#k_' + key + ' :v_' + key;
        //     }));
        // }
        
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