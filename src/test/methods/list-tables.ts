import test from 'ava';
import * as sinon from 'sinon';
import db from '../../';

db.connect();

const sandbox = sinon.sandbox.create();
let listTablesStub;

test.before(() => {
	listTablesStub = sandbox.stub(db.raw, 'listTables');
	listTablesStub.onFirstCall().yields(undefined, {LastEvaluatedTableName: 'test.baz', TableNames: ['test.baz']});
	listTablesStub.yields(undefined, {TableNames: ['test.foo', 'test.bar', 'prod.foo']});
});

test.after(() => {
	sandbox.restore();
});

test.serial('result', async t => {
	t.deepEqual(await db.listTables().exec(), ['test.baz', 'test.foo', 'test.bar', 'prod.foo']);
});

test.serial('filter result on prefix', async t => {
	db['options'].prefix = 'test';

	t.deepEqual(await db.listTables().exec(), ['test.foo', 'test.bar']);

	db['options'].prefix = undefined;
});

test.serial('error if not connected', async t => {
	const original = db.raw;
	db.raw = undefined;

	await t.throws(db.listTables().exec(), 'Call .connect() before executing queries.');

	db.raw = original;
});
