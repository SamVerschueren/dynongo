import { AbortError } from 'p-retry';

const whitelistedErrors = {
	ThrottlingException: true,
	ServiceUnavailable: true,
	ItemCollectionSizeLimitExceededException: true,
	LimitExceededException: true,
	ProvisionedThroughputExceededException: true,
	RequestLimitExceeded: true,
	InternalServerError: true,
	ResourceInUseException: true
};

export const retryErrorHandler = (err) => {
	if (!whitelistedErrors[err.code]) {
		throw new AbortError(err);
	}

	throw err;
};
