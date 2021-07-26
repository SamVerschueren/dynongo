interface Each<T> {
	/**
	 * Use with the $addToSet operator to add multiple values to an array <field> if the values do not exist in the <field>.
	 * @example { $addToSet: { <field>: { $each: [ <value1>, <value2> ... ] } } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/each }
	 */
	$each: T[];
}

export interface UpdateQuery<T = any> {
	/**
	 * Replaces the value of a field with the specified value.
	 * @example { $set: { <field1>: <value1>, ... } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/set }
	 */
	$set?: { [Property in keyof T]?: { $ifNotExists: T[Property] } | T[Property] | null };
	/**
	 * Deletes a particular field.
	 * @example { $unset: { <field1>: <boolean>, ... } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/unset }
	 */
	$unset?: { [Property in keyof T]?: boolean };
	/**
	 * Increments a field by a specified value and has the following form.
	 * @example { $inc: { <field1>: <amount1>, <field2>: <amount2>, ... } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/inc }
	 */
	$inc?: { [Property in keyof T]?: T[Property] extends number ? number : never };
	/**
	 * Appends a specified value to an array.
	 * @example { $push: { <field1>: <value1>, ... } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/push }
	 */
	$push?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U | Each<U>: never };
	/**
	 * Prepends a specified value to an array.
	 * @example { $unshift: { <field1>: <value1>, ... } }
	 */
	$unshift?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|Each<U> : never };
	/**
	 * Adds a value to an array unless the value is already present, in which case $addToSet does nothing to that array.
	 * @example { $addToSet: { <field1>: [<value1>, ...], ... } }
	 * @example { $addToSet: { <field1>: <value1>, ... } }
	 * @see {@link https://docs.mongodb.com/manual/reference/operator/update/addToSet }
	 */
	$addToSet?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|Each<U> : never };
	/**
	 * Removes a value from an array.
	 * @example { $addToSet: { <field1>: [<value1>, ...], ... } }
	 * @example { $addToSet: { <field1>: <value1>, ... } }
	 */
	$removeFromSet?: { [Property in keyof T]?: T[Property] extends (infer U)[] ? U|U[]|Each<U> : never };
}
