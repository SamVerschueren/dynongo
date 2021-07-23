export interface UpdateQuery<T = any> {
	/**
	 * Sets property equal to given value
	 */
	$set?: { [Property in keyof T]?: { $ifNotExists: T[Property] } | T[Property] };
	/**
	 * Unsets specified property
	 */
	$unset?: { [Property in keyof T]?: boolean };
	/**
	 * Increments a number value
	 */
	$inc?: { [Property in keyof T]?: T[Property] extends number ? number : never };
	/**
	 * $addToSet Appends given value or value array as an array to end of the set
	 */
	$push?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U | {$each: U[]}: never };
	/**
	 * $addToSet Appends given value or value array as an array to beginning of the set
	 */
	$unshift?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|{$each: U[]} : never };
	/**
	 * $addToSet Adds given value(s) to set
	 */
	$addToSet?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|{$each: U[]} : never };
	/**
	 * Removes given value(s) from set
	 */
	$removeFromSet?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|{$each: U[]} : never };
}
