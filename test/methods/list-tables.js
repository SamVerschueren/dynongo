import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect();

test.before(() => {
	const stub = sinon.stub(db.dynamodb.service, 'listTables');
	stub.onFirstCall().yields(undefined, {LastEvaluatedTableName: 'test.baz', TableNames: ['test.baz']});
	stub.yields(undefined, {TableNames: ['test.foo', 'test.bar', 'prod.foo']});
});

test.after(() => {
	db.dynamodb.service.listTables.restore();
});

test.serial('result', async t => {
	t.deepEqual(await db.listTables().exec(), ['test.baz', 'test.foo', 'test.bar', 'prod.foo']);
});

test.serial('filter result on prefix', async t => {
	db._prefix = 'test';

	t.deepEqual(await db.listTables().exec(), ['test.foo', 'test.bar']);

	db._prefix = undefined;
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(db.listTables().exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
