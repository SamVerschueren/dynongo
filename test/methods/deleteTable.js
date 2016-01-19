import test from 'ava';
import sinon from 'sinon';
import DeleteTable from '../../lib/methods/DeleteTable';
import db from '../../';

db.connect();

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db._dynamodb.service, 'deleteTable').yields(undefined, undefined);
});

test.after(() => {
	db._dynamodb.service.deleteTable.restore();
});

test('drop method returns DeleteTable object', t => {
	const query = db.dropTable('Table');

	t.ok(query instanceof DeleteTable);
	t.is(query._table, 'Table');
});

test.serial('drop', async t => {
	await Table.drop().exec();

	t.same(db._dynamodb.service.deleteTable.lastCall.args[0], {
		TableName: 'Table'
	});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.drop().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
