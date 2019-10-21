import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';
import { serviceUnavailableException, throttlingException, conditionalCheckFailedException } from '../fixtures/aws-error';

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

const fixtureWithRetry = {
	TableName: 'Table',
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '200'
	}
};

const fixtureWithRetryAbort = {
	TableName: 'Table',
	KeyConditionExpression: '#k_id=:v_id',
	ExpressionAttributeNames: {
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_id': '422'
	}
};

const sandbox = sinon.createSandbox();
let queryStub: sinon.SinonStub;
let scanStub: sinon.SinonStub;

test.before(() => {
	queryStub = sandbox.stub(db.dynamodb !, 'query');
	queryStub.withArgs(fixture1).returns(stubPromise({}));
	queryStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	queryStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	queryStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Count: 2, Items: ['foo', 'bar']}));
	queryStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	queryStub.returns(stubPromise({Count: 2, Items: ['foo', 'bar']}));

	scanStub = sandbox.stub(db.dynamodb !, 'scan');
	scanStub.withArgs(fixture2).returns(stubPromise({}));
	scanStub.returns(stubPromise({Count: 3, Items: ['foo', 'bar', 'baz']}));
});

test.after(() => {
	sandbox.restore();
});

/* QUERY */
test.serial('find', async t => {
	await Table.find({id: '5'}).exec();

	t.deepEqual(queryStub.lastCall.args[0], {
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

test.serial('should retry on error', async t => {
	queryStub.resetHistory();

	await t.notThrowsAsync(Table.find({id: '200'}).retry(3).exec());

	t.is(queryStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error', async t => {
	queryStub.resetHistory();

	await t.throwsAsync(Table.find({id: '422'}).retry(3).exec(), conditionalCheckFailedException);

	t.is(queryStub.callCount, 1);
});

test.serial('find with index', async t => {
	await Table.find({id: '5'}, 'IdIndex').exec();

	t.deepEqual(queryStub.lastCall.args[0], {
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

	t.deepEqual(queryStub.lastCall.args[0], {
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

test.serial('exclusive start key', async t => {
	await Table.find({id: '5'}).startFrom({id: '10', foo: 'bar'}).exec();

	t.deepEqual(queryStub.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_id=:v_id',
		ExclusiveStartKey: {
			id: '10',
			foo: 'bar'
		},
		ExpressionAttributeNames: {
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_id': '5'
		}
	});
});

test.serial('sort ascending', async t => {
	await (Table.find({id: '5'}) as any).sort(1).exec();

	t.true(queryStub.lastCall.args[0].ScanIndexForward);
});

test.serial('sort descending', async t => {
	await (Table.find({id: '5'}) as any).sort(-1).exec();

	t.false(queryStub.lastCall.args[0].ScanIndexForward);
});

test.serial('count', async t => {
	t.is(await Table.find({id: '5'}).count().exec(), 2);
});

test.serial('count with no result', async t => {
	t.is(await Table.find({foo: 'bar'}).count().exec(), 0);
});

test.serial('select undefined', async t => {
	await Table.find({foo: 'bar'}).select(undefined).count().exec();

	t.deepEqual(queryStub.lastCall.args[0], {
		TableName: 'Table',
		KeyConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		},
		Select: 'COUNT'
	});
});

test.serial('select one', async t => {
	await Table.find({foo: 'bar'}).select('foo').count().exec();

	t.deepEqual(queryStub.lastCall.args[0], {
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

	t.deepEqual(queryStub.lastCall.args[0], {
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

	t.deepEqual(queryStub.lastCall.args[0], {
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
	t.deepEqual(await Table.find({id: '5'}).exec(), ['foo', 'bar']);
});

test.serial('raw result', async t => {
	t.deepEqual(await Table.find({id: '5'}).raw().exec(), {Count: 2, Items: ['foo', 'bar']});
});

test.serial('raw result limit', async t => {
	t.deepEqual(await Table.find({id: '5'}).limit(1).raw().exec(), {Count: 2, Items: ['foo']});
});

test('sort throws error', async t => {
	await t.throwsAsync((Table.find({id: '5'}) as any).sort(true as any).exec(), 'Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.');
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.find({id: '5'}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});

/* SCAN */
test.serial('find all', async t => {
	await Table.find().exec();

	t.deepEqual(scanStub.lastCall.args[0], {TableName: 'Table'});
});

test.serial('find all where', async t => {
	await Table.find().where({name: 'foo'}).exec();

	t.deepEqual(scanStub.lastCall.args[0], {
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

test.serial('scan::exclusive start key', async t => {
	await Table.find().startFrom({id: '10', foo: 'bar'}).exec();

	t.deepEqual(scanStub.lastCall.args[0], {
		TableName: 'Table',
		ExclusiveStartKey: {
			id: '10',
			foo: 'bar'
		}
	});
});

test.serial('scan::result', async t => {
	t.deepEqual(await Table.find().exec(), ['foo', 'bar', 'baz']);
});

test.serial('scan::raw result', async t => {
	t.deepEqual(await Table.find().raw().exec(), {Count: 3, Items: ['foo', 'bar', 'baz']});
});

test.serial('scan::raw result limit', async t => {
	t.deepEqual(await Table.find().limit(1).raw().exec(), {Count: 3, Items: ['foo']});
});

test.serial('scan::count all', async t => {
	t.is(await Table.find().count().exec(), 3);
});

test.serial('scan::count all with no result', async t => {
	t.is(await Table2.find().count().exec(), 0);
});

test.serial('scan::error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.find().count().exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
