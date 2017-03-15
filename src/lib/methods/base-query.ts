import * as queryUtil from '../utils/query';
import { Method } from './method';

export abstract class BaseQuery extends Method {

	protected rawResult: boolean;

	/**
	 * Initialize the query object.
	 *
	 * @param	query			The query for the index to filter on.
	 * @param	indexName		The name of the global secondary index.
	 */
	initialize(query: any, indexName?: string) {
		// Parse the query
		const parsedQuery = queryUtil.parse(query, this.params.ExpressionAttributeValues);

		// Add the parsed query attributes to the correct properties of the params object
		this.params.KeyConditionExpression = parsedQuery.ConditionExpression;
		this.params.ExpressionAttributeNames = Object.assign({}, this.params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
		this.params.ExpressionAttributeValues = Object.assign({}, this.params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

		if (indexName) {
			// If the index name is provided, add it to the params object
			this.params.IndexName = indexName;
		}

		// Return the query so that it can be chained
		return this;
	};

	/**
	 * Filter the records more fine grained.
	 *
	 * @param	query			The query to filter the records on.
	 */
	where(query: any) {
		// Parse the query
		const parsedQuery = queryUtil.parse(query, this.params.ExpressionAttributeValues);

		// Add the parsed query attributes to the correct properties of the params object
		this.params.FilterExpression = parsedQuery.ConditionExpression;
		this.params.ExpressionAttributeNames = Object.assign({}, this.params.ExpressionAttributeNames, parsedQuery.ExpressionAttributeNames);
		this.params.ExpressionAttributeValues = Object.assign({}, this.params.ExpressionAttributeValues, parsedQuery.ExpressionAttributeValues);

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Select a subset of the result.
	 *
	 * projection		The projection string that defines which fields should be returned.
	 */
	select(projection: string | undefined) {
		if (!projection) {
			return this;
		}

		// Convert space separated or comma separated lists to a single comma
		projection = projection.replace(/,? +/g, ',');

		// Split the projection by space
		const splittedProjection = projection.split(',');

		// Reconstruct the expression
		const expression = splittedProjection.map(p => `#k_${p}`).join(', ');

		// Construct the names object
		const names = {};
		for (const token of splittedProjection) {
			names[`#k_${token}`] = token;
		}

		// Add the projection expression and add the list of names to the attribute names list
		this.params.ProjectionExpression = expression;
		this.params.ExpressionAttributeNames = Object.assign({}, this.params.ExpressionAttributeNames, names);

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Limit the number of items returned. If the limit is set to 1, the exec method
	 * will return the first object instead of an array with one object.
	 *
	 * @param	limit			The limit of items that should be returned.
	 */
	limit(limit: number) {
		// Set the limit of returned items
		this.params.Limit = limit;

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Returns the number of documents that match the query.
	 */
	count() {
		// Set the count parameter to true.
		this.params.Select = 'COUNT';

		// Return the query so that it can be chained
		return this;
	}

	/**
	 * Returns the raw result.
	 */
	raw() {
		// Set the raw parameter to true.
		this.rawResult = true;

		// Return the query so that it can be chained
		return this;
	}
}
