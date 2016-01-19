import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect({prefix: 'delete'});

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db._dynamodb, 'delete').yields(undefined, undefined);
});

test.after(() => {
	db._dynamodb.delete.restore();
});

test.serial('delete', async t => {
	await Table.remove({id: '5'}).exec();

	t.same(db._dynamodb.delete.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		}
	});
});

test.serial('where', async t => {
	await Table.remove({id: '5'}).where({foo: 'bar'}).exec();

	t.same(db._dynamodb.delete.lastCall.args[0], {
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

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.remove({id: '5'}).exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
