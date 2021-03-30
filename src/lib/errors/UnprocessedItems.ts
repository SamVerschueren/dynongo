export class UnprocessedItemsException {
	constructor(message: string) {
		const error = Error(message);

		Object.defineProperty(error, 'message', {
			get() {
				return message;
			}
		});
		Object.defineProperty(error, 'name', {
			get() {
				return 'UnprocessedItemsException';
			}
		});
		Object.defineProperty(error, 'code', {
			get() {
				return 'UnprocessedItemsException';
			}
		});

		Error.captureStackTrace(error, UnprocessedItemsException);
		return error;
	}
}
