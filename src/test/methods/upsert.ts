import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect();

const Table = db.table('Table');

const sandbox = sinon.createSandbox();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb !, 'update');
	updateStub.returns(stubPromise({Attributes: 'foo'}));
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

test.serial('increment and set with upsert', async t => {
	await Table.upsert({id: '5'}, {foo: 'bar', $inc: {salary: 5}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo, #k_salary=if_not_exists(#k_salary, :_v_empty_value)+:v_salary',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_salary': 'salary'
		},
		ExpressionAttributeValues: {
			':_v_empty_value': 0,
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
