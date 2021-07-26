import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

interface BaseComparisonQueryOperators<T> {
	/**
	 * Specifies equality condition. The $eq operator matches documents where the value of a field equals the specified value.
	 * @example { <field>: { $eq: <value> } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/eq}
	 */
	$eq?: T;
}

interface ComparisonQueryOperators<T> extends BaseComparisonQueryOperators<T> {
	/**
	 * Selects the documents where the value of a field equals any value in the specified array. To specify an $in expression, use the following prototype:
	 * @example { field: { $in: [<value1>, <value2>, ... <valueN> ] } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/in}
	 */
	$in?: T[];
	/**
	 * Selects the documents where:
    	- the field value is not in the specified array or
    	- the field does not exist.
	 * @example { field: { $nin: [ <value1>, <value2> ... <valueN> ]} }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/nin}
	 */
	$nin?: T[];
}

interface NumberComparisonOperators extends ComparisonQueryOperators<number>, ElementQueryOperators {
	/**
	 * Selects those documents where the value of the field is greater than (i.e. >) the specified value.
	 * @example {field: {$gt: value} }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/gt}
	 */
	$gt?: number;
	/**
	 * Selects the documents where the value of the field is greater than or equal to (i.e. >=) a specified value (e.g. value.)
	 * @example
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/gte}
	 */
	$gte?: number;
	/**
	 * Selects the documents where the value of the field is less than (i.e. <) the specified value.
	 * @example {field: {$lt: value} }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/lt}
	 */
	$lt?: number;
	/**
	 * Selects the documents where the value of the field is less than or equal to (i.e. <=) the specified value.
	 * @example { field: { $lt: value} }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/lte}
	 */
	$lte?: number;
	/**
	 * Greater than or equal to the first value, and less than or equal to the second value.
	 * @example { field: { $between: [ <value1>, <value2> ]} }
	 * @see {@link https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Condition.html}
	 */
	$between?: [number, number];
}

interface StringComparisonOperators extends ElementQueryOperators, ComparisonQueryOperators<string> {
	/**
	 * Checks for a prefix.
	 * @example { field: { $beginsWith: value } }
	 * @see {@link https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Condition.html}
	 */
	$beginsWith?: string|number;
}

interface ArrayComparisonOperators<T> extends ElementQueryOperators, BaseComparisonQueryOperators<T> {
	/**
	 * Checks for a subsequence, or value in a set.
	 * @example { field: { contains: value } }
	 * @see {@link https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Condition.html}
	 */
	$contains?: T;
}

interface LogicalQueryOperators<T> {
	/**
	 * Performs a logical AND operation on an array of one or more expressions (e.g. <expression1>, <expression2>, etc.) and selects the documents that satisfy all the expressions in the array.
	 * @example { $and: [ { <expression1> }, { <expression2> } , ... , { <expressionN> } ] }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/and}
	 */
	$and?: WhereQuery<T>[];
	/**
	 * Performs a logical NOT operation on the specified <operator_expression> and selects the documents that do not match the <operator-expression>. This includes documents that do not contain the field.
	 * @example { field: { $not: { <operator-expression> } } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/not}
	 */
	$not?: WhereQuery<T>;
	/**
	 * Performs a logical OR operation on an array of two or more <expressions> and selects the documents that satisfy at least one of the <expressions>.
	 * @example { $or: [ { <expression1> }, { <expression2> }, ... , { <expressionN> } ] }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/or}
	 */
	$or?: WhereQuery<T>[];
}
interface ElementQueryOperators {
	/**
	 * When <boolean> is true, $exists matches the documents that contain the field, including documents where the field value is null. If <boolean> is false, the query returns only the documents that do not contain the field.
	 * @example { field: { $exists: <boolean> } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/query/exists}
	 */
	$exists?: boolean;
}

export type WhereQuery<T = any> = {
		[Property in keyof T]?: T[Property] extends number
		? NumberComparisonOperators  | T[Property] : T[Property] extends string | DocumentClient.binaryType
			? StringComparisonOperators | T[Property] : T[Property] extends (infer U)[]
				? ArrayComparisonOperators<U> | T[Property] : BaseComparisonQueryOperators<T[Property]> | ElementQueryOperators | T[Property]
	}
	& LogicalQueryOperators<T>;
