import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import { serviceUnavailableException, throttlingException, conditionalCheckFailedException } from '../fixtures/aws-error';
import db from '../..';

db.connect();

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

const sandbox = sinon.createSandbox();
let queryStub: sinon.SinonStub;
let scanStub: sinon.SinonStub;

test.before(() => {
	queryStub = sandbox.stub(db.dynamodb !, 'query');
	queryStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	queryStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	queryStub.returns(stubPromise({Items: ['foo', 'bar']}));

	scanStub = sandbox.stub(db.dynamodb !, 'scan');
	scanStub.returns(stubPromise({Items: ['baz', 'foo', 'bar']}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('should retry on error', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.findOne({id: '20'}).retry(3).exec());

	t.is(queryStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error', async t => {
	queryStub.resetHistory();

	await t.throwsAsync(Table.findOne({id: '30'}).retry(3).exec(), conditionalCheckFailedException);

	t.is(queryStub.callCount, 1);
});

test.serial('find one', async t => {
	t.is(await Table.findOne({id: '5'}).exec(), 'foo');

	t.deepEqual(queryStub.lastCall.args[0], {
		TableName: 'Table',
		ConsistentRead: false,
		KeyConditionExpression: '#k_id=:v_id',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		},
		Limit: 1
	});
});

test.serial('find one with a consistent read', async t => {
	t.is(await Table.findOne({id: '5'}).consistent().exec(), 'foo');

	t.deepEqual(queryStub.lastCall.args[0], {
		TableName: 'Table',
		ConsistentRead: true,
		KeyConditionExpression: '#k_id=:v_id',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		},
		Limit: 1
	});
});

test.serial('find one where', async t => {
	t.is(await Table.findOne({id: '5'}).where({foo: 'bar'}).exec(), 'foo');

	t.deepEqual(queryStub.lastCall.args[0], {
		TableName: 'Table',
		ConsistentRead: false,
		KeyConditionExpression: '#k_id=:v_id',
		FilterExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_id': 'id',
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_id': '5',
			':v_foo': 'bar'
		}
	});
});

test.serial('find all but one', async t => {
	t.is(await Table.findOne().exec(), 'baz');

	t.deepEqual(scanStub.lastCall.args[0], {
		TableName: 'Table',
		ConsistentRead: false,
		Limit: 1
	});
});

test.serial('find all but one where', async t => {
	t.is(await Table.findOne().where({foo: 'bar'}).exec(), 'baz');

	t.deepEqual(scanStub.lastCall.args[0], {
		TableName: 'Table',
		ConsistentRead: false,
		FilterExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		}
	});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.findOne().exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
