export class UnprocessedItemsException extends Error {
	readonly name: 'UnprocessedItemsException' = 'UnprocessedItemsException';
	readonly code: 'UnprocessedItemsException' = 'UnprocessedItemsException';

	constructor(message: string) {
		super(message);

		// Restore prototype chain
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
