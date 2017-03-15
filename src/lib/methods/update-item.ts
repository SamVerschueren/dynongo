import * as pify from 'pify';
import * as queryUtil from '../utils/query';
import { InsertItem } from './insert-item';
import { Executable } from './executable';

export class UpdateItem extends InsertItem implements Executable {

	/**
	 * Create a conditional update item object where the condition should be satisfied in order for the item to be
	 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
	 *
	 * @param	condition           A condition that must be satisfied in order for a conditional UpdateItem to succeed.
	 */
	where(condition: any) {
		// Parse the query
		const parsedQuery = queryUtil.parse(condition, this.params.ExpressionAttributeValues);

		if (this.params.ConditionExpression) {
			this.params.ConditionExpression = `(${this.params.ConditionExpression}) AND (${parsedQuery.ConditionExpression})`;
		} else {
			this.params.ConditionExpression = parsedQuery.ConditionExpression;
		}

		// Add the parsed query attributes to the correct properties of the params object
		this.params.ExpressionAttributeNames = Object.assign({}, this.params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
		this.params.ExpressionAttributeValues = Object.assign({}, this.params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

		// Return the object for chaining purposes
		return this;
	}

	/**
	 * This method will execute the update item request that was built up.
	 */
	exec() {
		const db = this.dynamodb.dynamodb;

		if (!db) {
			return Promise.reject(new Error('Call .connect() before executing queries.'));
		}

		this.params.TableName = this.table.name;

		return pify(db.update.bind(db), Promise)(this.params)
			.then(data => {
				// Return the attributes
				return this.rawResult === true ? data : data.Attributes;
			});
	}
}
