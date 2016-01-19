import test from 'ava';
import sinon from 'sinon';
import CreateTable from '../../lib/methods/CreateTable';
import db from '../../';
import schema from '../fixtures/schema.json';

db.connect({prefix: 'foo'});

const Table = db.table('Bar');

test.before(() => {
	sinon.stub(db._dynamodb.service, 'createTable').yields(undefined, undefined);
});

test.after(() => {
	db._dynamodb.service.createTable.restore();
});

test('create method returns CreateTable object', t => {
	const query = db.createTable({TableName: 'Table'});

	t.ok(query instanceof CreateTable);
	t.is(query._table, 'Table');
});

test('throws error if no schema provided', t => {
	t.throws(db.createTable.bind(db), 'Provide a schema object');
});

test('throws error if no schema provided', t => {
	t.throws(Table.create.bind(Table), 'Provide a schema object');
});

test('throws error if no table name is provided', t => {
	t.throws(db.createTable.bind(db, {}), 'The schema is missing a TableName');
});

test.serial('create table', async t => {
	await db.createTable(schema).exec();

	t.same(db._dynamodb.service.createTable.lastCall.args[0], schema);
});

test.serial('create table updates table name', async t => {
	await Table.create(schema).exec();

	t.same(db._dynamodb.service.createTable.lastCall.args[0], {
		TableName: 'foo.Bar',
		AttributeDefinitions: [
			{
				AttributeName: 'id',
				AttributeType: 'S'
			}
		],
		KeySchema: [
			{
				AttributeName: 'id',
				KeyType: 'HASH'
			}
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 1,
			WriteCapacityUnits: 1
		}
	});
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(db.createTable(schema).exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
