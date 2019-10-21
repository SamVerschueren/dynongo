import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';
import { serviceUnavailableException, throttlingException, conditionalCheckFailedException } from '../fixtures/aws-error';

const Table = db.table('Table');

// Connect after defining the table
db.connect({prefix: 'insert', prefixDelimiter: '-'});

const fixture1 = {TableName: 'insert-Table', Key: {id: '10'}, ReturnValues: 'ALL_NEW', UpdateExpression: sinon.match.any, ExpressionAttributeNames: sinon.match.any, ExpressionAttributeValues: sinon.match.any, ConditionExpression: sinon.match.any};
const fixture2 = {TableName: 'insert-Table', Key: {id: '20'}, ReturnValues: 'ALL_NEW', UpdateExpression: sinon.match.any, ExpressionAttributeNames: sinon.match.any, ExpressionAttributeValues: sinon.match.any, ConditionExpression: sinon.match.any};
const fixtureWithRetry = {TableName: 'insert-Table', ReturnValues: 'ALL_NEW', Key: {id: '200'}, UpdateExpression: 'SET #k_email=:v_email', ConditionExpression: 'NOT (#k_id=:v_id)', ExpressionAttributeNames: {'#k_email': 'email', '#k_id': 'id'}, ExpressionAttributeValues: {':v_email': 'foo@bar.com', ':v_id': '200'}};
const fixtureWithRetryAbort = {TableName: 'insert-Table', ReturnValues: 'ALL_NEW', Key: {id: '422'}, UpdateExpression: 'SET #k_email=:v_email', ConditionExpression: 'NOT (#k_id=:v_id)', ExpressionAttributeNames: {'#k_email': 'email', '#k_id': 'id'}, ExpressionAttributeValues: {':v_email': 'foo@bar.com', ':v_id': '422'}};

const conditionalCheckException: any = new Error('The conditional request failed');
conditionalCheckException.code = 'ConditionalCheckFailedException';
conditionalCheckException.time = new Date();
conditionalCheckException.requestId = '6959aacc-a958-4c71-b8e5-00ad4f158423';
conditionalCheckException.statusCode = 400;
conditionalCheckException.retryable = false;
conditionalCheckException.retryDelay = 0;

const sandbox = sinon.createSandbox();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb !, 'update');
	updateStub.withArgs(fixture1).returns(stubPromise(conditionalCheckException));
	updateStub.withArgs(fixture2).returns(stubPromise(new Error('foo')));
	updateStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	updateStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	updateStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Attributes: 'foo'}));
	updateStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	updateStub.returns(stubPromise({Attributes: 'foo'}));
});

test.after(() => {
	sandbox.restore();
});

test('error if a duplicate key was inserted', async t => {
	try {
		await Table.insert({id: '10'}, {$set: {foo: 'bar'}}).raw().exec();
		t.fail();
	} catch (err) {
		t.is(err.message, 'Duplicate key! A record with key `{"id":"10"}` already exists.');
		t.is(err.code, 'ConditionalCheckFailedException');
	}
});

test.serial('should retry on error', async t => {
	updateStub.resetHistory();

	await t.notThrowsAsync(Table.insert({id: '200'}, {email: 'foo@bar.com'}).retry(3).exec());

	t.is(updateStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error', async t => {
	updateStub.resetHistory();

	await t.throwsAsync(Table.insert({id: '422'}, {email: 'foo@bar.com'}).retry(3).exec(), conditionalCheckFailedException);

	t.is(updateStub.callCount, 1);
});

test('error', async t => {
	await t.throwsAsync(Table.insert({id: '20'}, {$set: {foo: 'bar'}}).raw().exec(), 'foo');
});

test.serial('insert key', async t => {
	await Table.insert({id: '5'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'insert-Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		ConditionExpression: 'NOT (#k_id=:v_id)',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('insert', async t => {
	await Table.insert({id: '5'}, {email: 'foo@bar.com'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'insert-Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_email=:v_email',
		ConditionExpression: 'NOT (#k_id=:v_id)',
		ExpressionAttributeNames: {
			'#k_email': 'email',
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_email': 'foo@bar.com',
			':v_id': '5'
		}
	});
});

test.serial('insert empty object', async t => {
	await Table.insert({id: '5'}, {}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'insert-Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		ConditionExpression: 'NOT (#k_id=:v_id)',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('result', async t => {
	t.is(await Table.insert({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'foo');
});

test.serial('raw result', async t => {
	t.deepEqual(await Table.insert({id: '5'}, {$set: {foo: 'bar'}}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.insert({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
