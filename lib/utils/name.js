'use strict';

/**
 * Utility methods for generating unique expression names.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  23 Jul. 2015
 */

module.exports = {
    /**
     * This method parses a key to an expression statement that can be used directly in an expression and to an
     * object that maps the keyname to the original name.
     * 
     * @param  {string}     key     The key that should be converted to a valid name
     * @return {object}             The Expression and ExpressionAttributeNames that can be used directly in the request object.
     */
    generateKeyName: function(key) {
        var splitted = key.split('.'),
            expression = [];
        
        // Iterate over the splitted properties
        var names = splitted.reduce(function(result, part) {
            // Push the key to the expression list
            expression.push('#k_' + part);
            
            // Remove array indexes
            part = part.replace(/\[[0-9]+\]/g, '');
            
            // Add the key with the keyvalue to the result
            result['#k_' + part] = part;
            
            return result;
        }, {});
        
        // Return the object
        return {
            Expression: expression.join('.'),
            ExpressionAttributeNames: names
        }
    },
    /**
     * This method generates a unique name, based on the key, for the value provided.
     * 
     * @param  {string}     key     The key that should be converted to a valid name
     * @param  {any}        value   The value associated with the key.
     * @param  {object}     values  The map of values allready generated.
     * @return {object}             The Expression and ExpressionAttributeNames that can be used directly in the request object.
     */
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