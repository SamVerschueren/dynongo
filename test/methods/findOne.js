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

test.serial('result', async t => {
	t.is(await Table.findOne({id: '5'}).exec(), 'foo');

	t.same(db._dynamodb.query.lastCall.args[0], {
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

test.serial('find all but one', async t => {
	t.is(await Table.findOne().exec(), 'baz');

	t.same(db._dynamodb.scan.lastCall.args[0], {
		TableName: 'Table',
		Limit: 1
	});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.findOne().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
