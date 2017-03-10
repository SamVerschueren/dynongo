'use strict';
module.exports = {
	lookupName: (name, dynamodb) => {
		const nameArray = dynamodb.prefix ? [].concat(dynamodb.prefix) : [];
		nameArray.push(name);

		return nameArray.join(dynamodb.delimiter);
	}
};
