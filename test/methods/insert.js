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

test.serial('insert key', async t => {
	await Table.insert({id: '5'}).exec();

	t.same(db._dynamodb.update.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		}
	});
});

test.serial('insert', async t => {
	await Table.insert({id: '5'}, {email: 'foo@bar.com'}).exec();

	t.same(db._dynamodb.update.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_email=:v_email',
		ExpressionAttributeNames: {
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_email': 'foo@bar.com'
		}
	});
});

test.serial('result', async t => {
	t.is(await Table.insert({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'foo');
});
