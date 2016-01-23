import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect();

const Table = db.table('Table');
const Table2 = db.table('Table2');

const fixture1 = {
	TableName: 'Table',
	KeyConditionExpression: '#k_foo=:v_foo',
	ExpressionAttributeNames: {
		'#k_foo': 'foo'
	},
	ExpressionAttributeValues: {
		':v_foo': 'bar'
	},
	Select: 'COUNT'
};

const fixture2 = {
	TableName: 'Table2',
	Select: 'COUNT'
};

test.before(() => {
	const queryStub = sinon.stub(db._dynamodb, 'query');
	queryStub.withArgs(fixture1).yields(undefined, {});
	queryStub.yields(undefined, {Count: 2, Items: ['foo', 'bar']});

	const scanStub = sinon.stub(db._dynamodb, 'scan');
	scanStub.withArgs(fixture2).yields(undefined, {});
	scanStub.yields(undefined, {Count: 3, Items: ['foo', 'bar', 'baz']});
});

test.after(() => {
	db._dynamodb.query.restore();
	db._dynamodb.scan.restore();
});

/* QUERY */
test.serial('find', async t => {
	await Table.find({id: '5'}).exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_id=:v_id',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('find with index', async t => {
	await Table.find({id: '5'}, 'IdIndex').exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		IndexName: 'IdIndex',
		KeyConditionExpression: '#k_id=:v_id',
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('limit', async t => {
	await Table.find({id: '5'}).limit(2).exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_id=:v_id',
		Limit: 2,
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('sort ascending', async t => {
	await Table.find({id: '5'}).sort(1).exec();

	t.true(db._dynamodb.query.lastCall.args[0].ScanIndexForward);
});

test.serial('sort descending', async t => {
	await Table.find({id: '5'}).sort(-1).exec();

	t.false(db._dynamodb.query.lastCall.args[0].ScanIndexForward);
});

test.serial('count', async t => {
	t.is(await Table.find({id: '5'}).count().exec(), 2);
});

test.serial('count with no result', async t => {
	t.is(await Table.find({foo: 'bar'}).count().exec(), 0);
});

test.serial('select one', async t => {
	await Table.find({foo: 'bar'}).select('foo').count().exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		},
		ProjectionExpression: '#k_foo',
		Select: 'COUNT'
	});
});

test.serial('select multiple (comma separated)', async t => {
	await Table.find({foo: 'bar'}).select('foo, bar').count().exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_bar': 'bar'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		},
		ProjectionExpression: '#k_foo, #k_bar',
		Select: 'COUNT'
	});
});

test.serial('select multiple (space separated)', async t => {
	await Table.find({foo: 'bar'}).select('foo bar').count().exec();

	t.same(db._dynamodb.query.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_bar': 'bar'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		},
		ProjectionExpression: '#k_foo, #k_bar',
		Select: 'COUNT'
	});
});

test.serial('result', async t => {
	t.same(await Table.find({id: '5'}).exec(), ['foo', 'bar']);
});

test.serial('raw result', async t => {
	t.same(await Table.find({id: '5'}).raw().exec(), {Count: 2, Items: ['foo', 'bar']});
});

test.serial('raw result limit', async t => {
	t.same(await Table.find({id: '5'}).limit(1).raw().exec(), {Count: 2, Items: ['foo']});
});

test('sort throws error', async t => {
	await t.throws(Table.find({id: '5'}).sort().exec(), 'Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.');
	await t.throws(Table.find({id: '5'}).sort(true).exec(), 'Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.');
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.find({id: '5'}).exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});

/* SCAN */
test.serial('find all', async t => {
	await Table.find().exec();

	t.same(db._dynamodb.scan.lastCall.args[0], {TableName: 'Table'});
});

test.serial('find all where', async t => {
	await Table.find().where({name: 'foo'}).exec();

	t.same(db._dynamodb.scan.lastCall.args[0], {
		TableName: 'Table',
		FilterExpression: '#k_name=:v_name',
		ExpressionAttributeNames: {
			'#k_name': 'name'
		},
		ExpressionAttributeValues: {
			':v_name': 'foo'
		}
	});
});

test.serial('result', async t => {
	t.same(await Table.find().exec(), ['foo', 'bar', 'baz']);
});

test.serial('raw result', async t => {
	t.same(await Table.find().raw().exec(), {Count: 3, Items: ['foo', 'bar', 'baz']});
});

test.serial('raw result limit', async t => {
	t.same(await Table.find().limit(1).raw().exec(), {Count: 3, Items: ['foo']});
});

test.serial('count all', async t => {
	t.is(await Table.find().count().exec(), 3);
});

test.serial('count all with no result', async t => {
	t.is(await Table2.find().count().exec(), 0);
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(Table.find().count().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
