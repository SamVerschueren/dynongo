'use strict';

module.exports = {
    generate: function(key) {
        return key.replace(/./g, '_');
    }
};