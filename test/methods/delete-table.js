import test from 'ava';
import sinon from 'sinon';
import DeleteTable from '../../lib/methods/delete-table';
import db from '../../';

db.connect({prefix: 'foo'});

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db._dynamodb.service, 'deleteTable').yields(undefined, undefined);
	const describe = sinon.stub(db._dynamodb.service, 'describeTable');
	describe.onFirstCall().yields(undefined, {Table: {TableStatus: 'ACTIVE'}});
	describe.yields({name: 'ResourceNotFoundException'});
});

test.after(() => {
	db._dynamodb.service.deleteTable.restore();
	db._dynamodb.service.describeTable.restore();
});

test('drop method returns DeleteTable object', t => {
	const query = db.dropTable('Table');

	t.truthy(query instanceof DeleteTable);
	t.is(query._table, 'Table');
});

test.serial('drop', async t => {
	await Table.drop().exec();

	t.deepEqual(db._dynamodb.service.deleteTable.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('await', async t => {
	await db.dropTable('Table').await().exec();

	t.deepEqual(db._dynamodb.service.describeTable.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.drop().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
