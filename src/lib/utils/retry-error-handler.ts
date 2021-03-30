import { AbortError } from 'p-retry';

const whitelistedErrors = new Set([
	'ThrottlingException',
	'ServiceUnavailable',
	'ItemCollectionSizeLimitExceededException',
	'LimitExceededException',
	'ProvisionedThroughputExceededException',
	'RequestLimitExceeded',
	'InternalServerError',
	'ResourceInUseException',
	'UnprocessedItemsException'
]);

export const retryErrorHandler = err => {
	if (whitelistedErrors.has(err.code)) {
		throw err;
	}

	throw new AbortError(err);
};
