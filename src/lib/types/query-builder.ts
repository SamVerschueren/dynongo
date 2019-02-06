export interface QueryBuilder {
	/**
	 * Builds and returns the raw DynamoDB query object.
	 */
	buildRawQuery(): any;
}
