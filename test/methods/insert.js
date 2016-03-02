import test from 'ava';
import sinon from 'sinon';
import db from '../../';

const Table = db.table('Table');

// Connect after defining the table
db.connect({prefix: 'insert', prefixDelimiter: '-'});

const fixture1 = {TableName: 'insert-Table', Key: {id: '10'}, ReturnValues: 'ALL_NEW', UpdateExpression: sinon.match.any, ExpressionAttributeNames: sinon.match.any, ExpressionAttributeValues: sinon.match.any, ConditionExpression: sinon.match.any};
const fixture2 = {TableName: 'insert-Table', Key: {id: '20'}, ReturnValues: 'ALL_NEW', UpdateExpression: sinon.match.any, ExpressionAttributeNames: sinon.match.any, ExpressionAttributeValues: sinon.match.any, ConditionExpression: sinon.match.any};

const conditionalCheckException = new Error('The conditional request failed');
conditionalCheckException.code = 'ConditionalCheckFailedException';
conditionalCheckException.time = new Date();
conditionalCheckException.requestId = '6959aacc-a958-4c71-b8e5-00ad4f158423';
conditionalCheckException.statusCode = 400;
conditionalCheckException.retryable = false;
conditionalCheckException.retryDelay = 0;

test.before(() => {
	const stub = sinon.stub(db._dynamodb, 'update');
	stub.withArgs(fixture1).yields(conditionalCheckException);
	stub.withArgs(fixture2).yields(new Error('foo'));
	stub.yields(undefined, {Attributes: 'foo'});
});

test.after(() => {
	db._dynamodb.update.restore();
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

test('error', async t => {
	t.throws(Table.insert({id: '20'}, {$set: {foo: 'bar'}}).raw().exec(), 'foo');
});

test.serial('insert key', async t => {
	await Table.insert({id: '5'}).exec();

	t.same(db._dynamodb.update.lastCall.args[0], {
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

	t.same(db._dynamodb.update.lastCall.args[0], {
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

test.serial('result', async t => {
	t.is(await Table.insert({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'foo');
});

test.serial('raw result', async t => {
	t.same(await Table.insert({id: '5'}, {$set: {foo: 'bar'}}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.insert({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
