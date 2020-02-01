import { Options as RetryOptions } from 'p-retry';

const defaultRetryOptions: RetryOptions = {
	retries: 5,
	factor: 2,
	minTimeout: 500,
	maxTimeout: 2000,
	randomize: true
};

/**
 * Configures the retry policy
 *
 * @param retries - Retry configuration.
 */
export const configureRetryOptions = (retries: number | RetryOptions | undefined) => {
	if (retries === undefined) {
		return;
	}

	return typeof retries === 'number' ? {...defaultRetryOptions, retries} : {...defaultRetryOptions, ...retries};
};
