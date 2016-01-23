import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect();

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db._dynamodb, 'update').yields(undefined, {Attributes: 'foo'});
});

test.after(() => {
	db._dynamodb.update.restore();
});

test.serial('upsert', async t => {
	await Table.upsert({id: '5'}, {foo: 'bar'}).exec();

	t.same(db._dynamodb.update.lastCall.args[0], {
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

test.serial('upsert', async t => {
	await Table.update({id: '5'}, {foo: 'bar'}, {upsert: true}).exec();

	t.same(db._dynamodb.update.lastCall.args[0], {
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

test.serial('raw result', async t => {
	t.same(await Table.upsert({id: '5'}, {foo: 'bar'}).where({email: 'foo@bar.com'}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.upsert({id: '5'}, {foo: 'bar'}).exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
