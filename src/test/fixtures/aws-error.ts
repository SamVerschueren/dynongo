export class AWSError extends Error {
	code: string;
	message: string;

	constructor(code: string, message: string) {
		super();

		this.code = code;
		this.message = message;
	}
}

export const serviceUnavailableException = new AWSError('ServiceUnavailable', 'DynamoDB is currently unavailable');
export const throttlingException = new AWSError('ThrottlingException', 'Rate of requests exceeds the allowed throughput');
export const conditionalCheckFailedException = new AWSError('ConditionalCheckFailedException', 'The conditional request failed');
export const itemCollectionSizeLimitExceededException = new AWSError('ItemCollectionSizeLimitExceededException', 'Collection size exceeded.');
export const limitExceededException = new AWSError('LimitExceededException', 'Too many operations for a given subscriber');
export const provisionedThroughputExceededException = new AWSError('ProvisionedThroughputExceededException', 'You exceeded your maximum allowed provisioned throughput for a table or for one or more global secondary indexes.');
export const requestLimitExceeded = new AWSError('RequestLimitExceeded', 'Throughput exceeds the current throughput limit for your account.');
export const internalServerError = new AWSError('InternalServerError', 'Internal Server Error');
export const resourceInUseException = new AWSError('ResourceInUseException', 'The resource which you are attempting to change is in use');
