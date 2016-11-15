'use strict';

/**
 * Utility methods for tables.
 *
 * @author Sam Verschueren	  <sam.verschueren@gmail.com>
 * @since  19 Jan. 2016
 */

module.exports = {
	lookupName: function (table, dynamodb) {
		var nameArray = dynamodb.prefix ? [].concat(dynamodb.prefix) : [];
		nameArray.push(table.name);

		return nameArray.join(dynamodb.delimiter);
	}
};
