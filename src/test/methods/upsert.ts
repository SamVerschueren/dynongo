import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';
import { serviceUnavailableException, throttlingException, conditionalCheckFailedException } from '../fixtures/aws-error';

db.connect();

const Table = db.table('Table');

const fixtureWithRetry = {
	TableName: 'Table',
	ReturnValues: 'ALL_NEW',
	Key: {
		id: '200'
	},
	UpdateExpression: 'SET #k_foo=:v_foo',
	ExpressionAttributeNames: {
		'#k_foo': 'foo'
	},
	ExpressionAttributeValues: {
		':v_foo': 'bar'
	}
};

const fixtureWithRetryAbort = {
	TableName: 'Table',
	ReturnValues: 'ALL_NEW',
	Key: {
		id: '422'
	},
	UpdateExpression: 'SET #k_foo=:v_foo',
	ExpressionAttributeNames: {
		'#k_foo': 'foo'
	},
	ExpressionAttributeValues: {
		':v_foo': 'bar'
	}
};

const sandbox = sinon.createSandbox();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb !, 'update');
	updateStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	updateStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	updateStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Attributes: 'foo'}));
	updateStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	updateStub.returns(stubPromise({Attributes: 'foo'}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('should retry on error', async t => {
	updateStub.resetHistory();

	await t.notThrowsAsync(Table.upsert({id: '200'}, {foo: 'bar'}).retry(3).exec());

	t.is(updateStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error', async t => {
	updateStub.resetHistory();

	await t.throwsAsync(Table.upsert({id: '422'}, {foo: 'bar'}).retry(3).exec(), conditionalCheckFailedException);

	t.is(updateStub.callCount, 1);
});

test.serial('upsert', async t => {
	await Table.upsert({id: '5'}, {foo: 'bar'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		}
	});
});

test.serial('upsert by calling update', async t => {
	await Table.update({id: '5'}, {foo: 'bar'}, {upsert: true}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		}
	});
});

test.serial('result', async t => {
	t.is(await Table.upsert({id: '5'}, {foo: 'bar'}).where({email: 'foo@bar.com'}).exec(), 'foo');
});

test.serial('increment and set with upsert', async t => {
	await Table.upsert({id: '5'}, {foo: 'bar', $inc: {salary: 5}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo ADD #k_salary :v_salary',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_salary': 'salary'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_salary': 5
		}
	});
});

test.serial('raw result', async t => {
	t.deepEqual(await Table.upsert({id: '5'}, {foo: 'bar'}).where({email: 'foo@bar.com'}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.upsert({id: '5'}, {foo: 'bar'}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
