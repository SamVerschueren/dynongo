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
        var valueKey = ':v_' + key.replace(/[^a-zA-Z0-9_]+/g, '_');
        
        if(values[valueKey] === value) {
            var i = 1;
            
            while(values[valueKey + '_' + i] === value) {
                ++i;
            }
            
            valueKey += '_' + i;
        }
        
        var expressionValues = {};
        expressionValues[valueKey] = value;
        
        return {
            Expression: valueKey,
            ExpressionAttributeValues: expressionValues
        };
    }
};