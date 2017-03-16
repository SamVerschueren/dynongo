import test from 'ava';
import * as sinon from 'sinon';
import db = require('../../');

db.connect();

const Table = db.table('Table');

const sandbox = sinon.sandbox.create();
let queryStub: sinon.SinonStub;
let scanStub: sinon.SinonStub;

test.before(() => {
	queryStub = sandbox.stub(db.dynamodb, 'query');
	queryStub.yields(undefined, {Items: ['foo', 'bar']});

	scanStub = sandbox.stub(db.dynamodb, 'scan');
	scanStub.yields(undefined, {Items: ['baz', 'foo', 'bar']});
});

test.after(() => {
	sandbox.restore();
});

test.serial('find one', async t => {
	t.is(await Table.findOne({id: '5'}).exec(), 'foo');

	t.deepEqual(queryStub.lastCall.args[0], {
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

	t.deepEqual(queryStub.lastCall.args[0], {
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

	t.deepEqual(scanStub.lastCall.args[0], {
		TableName: 'Table',
		Limit: 1
	});
});

test.serial('find all but one where', async t => {
	t.is(await Table.findOne().where({foo: 'bar'}).exec(), 'baz');

	t.deepEqual(scanStub.lastCall.args[0], {
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
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(Table.findOne().exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
