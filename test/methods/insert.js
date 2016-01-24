import test from 'ava';
import sinon from 'sinon';
import db from '../../';

const Table = db.table('Table');

// Connect after defining the table
db.connect({prefix: 'insert', prefixDelimiter: '-'});

test.before(() => {
	sinon.stub(db._dynamodb, 'update').yields(undefined, {Attributes: 'foo'});
});

test.after(() => {
	db._dynamodb.update.restore();
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
