import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import { serviceUnavailableException, throttlingException, conditionalCheckFailedException, internalServerError, itemCollectionSizeLimitExceededException, limitExceededException, provisionedThroughputExceededException, requestLimitExceeded, resourceInUseException } from '../fixtures/aws-error';
import db from '../..';

db.connect({retries: {retries: 3}});

const Table = db.table('Table');

const fixtureWithRetry = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '20'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const fixtureWithRetryLong = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '200'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const fixtureOverrideWithOptions = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '300'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const fixtureWithRetryAbort = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '30'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const fixtureForceNoRetries = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '40'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const fixtureAllErrorsRetries = {
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '400'
	},
	Limit: 1,
	ConsistentRead: false,
	TableName: 'Table'
};

const sandbox = sinon.createSandbox();
let queryStub: sinon.SinonStub;

test.before(() => {
	queryStub = sandbox.stub(db.dynamodb !, 'query');
	queryStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	queryStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureWithRetryLong).onFirstCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetryLong).onSecondCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetryLong).onThirdCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetryLong).onCall(4).returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(0).returns(stubPromise(requestLimitExceeded));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(1).returns(stubPromise(internalServerError));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(2).returns(stubPromise(itemCollectionSizeLimitExceededException));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(3).returns(stubPromise(provisionedThroughputExceededException));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(4).returns(stubPromise(resourceInUseException));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(5).returns(stubPromise(serviceUnavailableException));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(6).returns(stubPromise(limitExceededException));
	queryStub.withArgs(fixtureAllErrorsRetries).onCall(7).returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureOverrideWithOptions).onFirstCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureOverrideWithOptions).onSecondCall().returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	queryStub.withArgs(fixtureForceNoRetries).onFirstCall().returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.returns(stubPromise({Items: ['foo', 'bar']}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('should retry on error with configuration passed during configuration', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '20'}).exec());

	t.is(queryStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error with configuration passed during configuration', async t => {
	queryStub.resetHistory();

	await t.throwsAsync(Table.findOne({id: '30'}).exec(), conditionalCheckFailedException);

	t.is(queryStub.callCount, 1);
});

test.serial('should override the retry specified during initialisation with a number', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '200'}).retry(4).exec());

	t.is(queryStub.callCount, 4);
});

test.serial('should override the retry specified during initialisation with an options object', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '300'}).retry({retries: 2}).exec());

	t.is(queryStub.callCount, 2);
});

test.serial('Providing `0` as number of retries will not perform any retries', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '40'}).retry(0).exec());

	t.is(queryStub.callCount, 1);
});

test.serial('should retry on retryable error', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '400'}).retry({retries: 10, factor: 1}).exec());

	t.is(queryStub.callCount, 8);
});
