import test from 'ava';
import * as sinon from 'sinon';
import db from '../../';

db.connect();

const Table = db.table('Table');

const sandbox = sinon.sandbox.create();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb, 'update');
	updateStub.yields(undefined, {Attributes: 'foo'});
});

test.after(() => {
	sandbox.restore();
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

test.serial('raw result', async t => {
	t.deepEqual(await Table.upsert({id: '5'}, {foo: 'bar'}).where({email: 'foo@bar.com'}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(Table.upsert({id: '5'}, {foo: 'bar'}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
