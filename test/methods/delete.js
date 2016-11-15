import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect({prefix: 'delete'});

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db.dynamodb, 'delete').yields(undefined, {Attributes: {id: '5', foo: 'bar'}});
});

test.after(() => {
	db.dynamodb.delete.restore();
});

test.serial('delete', async t => {
	await Table.remove({id: '5'}).exec();

	t.deepEqual(db.dynamodb.delete.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		}
	});
});

test.serial('result', async t => {
	t.falsy(await Table.remove({id: '5'}).exec());
});

test.serial('where', async t => {
	await Table.remove({id: '5'}).where({foo: 'bar'}).exec();

	t.deepEqual(db.dynamodb.delete.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		},
		ConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		}
	});
});

test.serial('find one and remove', async t => {
	await Table.findOneAndRemove({id: '5'}).exec();

	t.deepEqual(db.dynamodb.delete.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		},
		ReturnValues: 'ALL_OLD'
	});
});

test('find one and remove result', async t => {
	t.deepEqual(await Table.findOneAndRemove({id: '5'}).exec(), {id: '5', foo: 'bar'});
});

test('find one and remove raw result', async t => {
	t.deepEqual(await Table.findOneAndRemove({id: '5'}).raw().exec(), {Attributes: {id: '5', foo: 'bar'}});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(Table.remove({id: '5'}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
