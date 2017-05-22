import test from 'ava';
import * as sinon from 'sinon';
import db = require('../../');

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

test.serial('single key update', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5'
		},
		ConditionExpression: '#k_id=:v_id'
	});
});

test.serial('multi key update', async t => {
	await Table.update({id: '5', email: 'foo@bar.com'}, {$set: {foo: 'bar'}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5',
			email: 'foo@bar.com'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '#k_id=:v_id AND #k_email=:v_email'
	});
});

test.serial('where', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}, $inc: {salary: 1000}}).where({email: 'foo@bar.com'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo, #k_salary=if_not_exists(#k_salary, :_v_empty_value)+:v_salary',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_salary': 'salary',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':_v_empty_value': 0,
			':v_foo': 'bar',
			':v_salary': 1000,
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (#k_email=:v_email)'
	});
});

test.serial('where with $or', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({$or: [{email: {$exists: false}}, {email: 'foo@bar.com'}]}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (attribute_not_exists(#k_email) OR #k_email=:v_email)'
	});
});

test.serial('where with $or and comparison', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({foo: 'baz', $or: [{email: {$exists: false}}, {email: 'foo@bar.com'}]}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_foo_1': 'baz',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (#k_foo=:v_foo_1 AND (attribute_not_exists(#k_email) OR #k_email=:v_email))'
	});
});

test.serial('result', async t => {
	t.is(await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({email: 'foo@bar.com'}).exec(), 'foo');
});

test.serial('raw result', async t => {
	t.deepEqual(await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({email: 'foo@bar.com'}).raw().exec(), {Attributes: 'foo'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(Table.update({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
