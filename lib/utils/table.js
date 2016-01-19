'use strict';

/**
 * Utility methods for tables.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  19 Jan. 2016
 */

module.exports = {
	lookupName: function (name, dynamodb) {
		var nameArray = dynamodb._prefix ? [].concat(dynamodb._prefix) : [];
		nameArray.push(name);

		return nameArray.join(dynamodb._delimiter);
	}
};
