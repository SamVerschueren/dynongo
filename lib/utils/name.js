'use strict';

module.exports = {
    generateKeyName: function(key) {
        var splitted = key.split('.'),
            expression = [];
        
        var names = splitted.reduce(function(result, part) {
            expression.push('#k_' + part);
            
            // Remove array indexes
            part = part.replace(/\[[0-9]+\]/g, '');
            
            result['#k_' + part] = part;
            
            return result;
        }, {});
        
        return {
            Expression: expression.join('.'),
            ExpressionAttributeNames: names
        }
    },
    generateValueName: function(key, value, values) {        
        var valueKey = ':v_' + key.replace(/[^a-zA-Z0-9_]+/g, '_'),
            expression,
            expressionValues = {};
        
        if(Array.isArray(value)) {
            expression = [];
            
            for(var i=0; i<value.length; i++) {
                var tempKey = indexify(valueKey + '_' + i);
                
                expression.push(tempKey);
                
                expressionValues[tempKey] = value[i];
            }
        }
        else {
            expression = indexify(valueKey);
            
            expressionValues[expression] = value;
        }
        
        function indexify(k) {
            if(values[k] === value) {
                var i = 1;
                
                while(values[k + '_' + i] === value) {
                    ++i;
                }
                
                k += '_' + i;
            }
            
            return k;
        }
        
        return {
            Expression: expression,
            ExpressionAttributeValues: expressionValues
        };
    }
};