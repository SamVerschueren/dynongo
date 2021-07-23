interface BaseComparisonQueryOperators<T> {
	$eq?: T;
}

interface ComparisonQueryOperators<T> extends BaseComparisonQueryOperators<T> {
	$in?: T[];
	$nin?: T[];
}

interface NumberComparisonOperators extends ComparisonQueryOperators<number> {
	$gt?: number;
	$gte?: number;
	$lt?: number;
	$lte?: number;
	$between: [number, number];
}

interface StringComparisonOperators {
	$beginsWith: string;
}

interface ArrayComparisonOperators<T> {
	$contains: T;
}

interface LogicalQueryOperators<T> {
	$and?: WhereQuery<T>[];
	$not?: WhereQuery<T>;
	$or?: WhereQuery<T>[];
}
interface ElementQueryOperators {
	$exists?: boolean;
}

export type WhereQuery<T = any> = {
		[Property in keyof T]?: T[Property] extends number
		? NumberComparisonOperators | T[Property] : T[Property] extends string
			? StringComparisonOperators | T[Property] : T[Property] extends (infer U)[]
				? ArrayComparisonOperators<U> | BaseComparisonQueryOperators<T> | ElementQueryOperators | T[Property] : BaseComparisonQueryOperators<T[Property]> | ElementQueryOperators | T[Property]
	}
	& LogicalQueryOperators<T>;
