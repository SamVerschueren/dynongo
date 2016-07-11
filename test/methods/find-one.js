import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect();

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db._dynamodb, 'query').yields(undefined, {Items: ['foo', 'bar']});
	sinon.stub(db._dynamodb, 'scan').yields(undefined, {Items: ['baz', 'foo', 'bar']});
});

test.after(() => {
	db._dynamodb.query.restore();
	db._dynamodb.scan.restore();
});

test.serial('find one', async t => {
	t.is(await Table.findOne({id: '5'}).exec(), 'foo');

	t.deepEqual(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
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

	t.deepEqual(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
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

	t.deepEqual(db._dynamodb.scan.lastCall.args[0], {
		TableName: 'Table',
		Limit: 1
	});
});

test.serial('find all but one where', async t => {
	t.is(await Table.findOne().where({foo: 'bar'}).exec(), 'baz');

	t.deepEqual(db._dynamodb.scan.lastCall.args[0], {
		TableName: 'Table',
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
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.findOne().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
