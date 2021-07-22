import db from '../../index';
import sinon from 'sinon';
import test from 'ava';
import stubPromise from '../fixtures/stub-promise';
import { PutRequest } from '../../lib/methods/batch';

const Table1 = db.table('Table1');
const Table2 = db.table('Table2');

// Connect after defining the table
db.connect({prefix: 'insert', prefixDelimiter: '-'});

const fixture = {
	RequestItems: {
		'insert-Table': [
			{
				PutRequest: {
					Item: {
						partitionKey: 'PK',
						sortKey: 'SK',
						name: 'name',
						lastname: 'lastname'
					}
				}
			},
			{
				PutRequest: {
					Item: {
						partitionKey: 'PK2',
						sortKey: 'SK2',
						name: 'name2',
						lastname: 'lastname2'
					}
				}
			}
		]
	}
};

const throttleFixture = {
	RequestItems: {
		'insert-Table1': [
			{
				PutRequest: {
					Item: {
						partitionKey: 'PK',
						sortKey: 'SK',
						name: 'name',
						lastname: 'lastname'
					}
				}
			}
		]
	}
};

const response = {
	ItemCollectionMetrics: null,
	ConsumedCapacity: null,
	UnprocessedItems: {}
};

// @ts-ignore
const throttleData = {
	ItemCollectionMetrics: null,
	ConsumedCapacity: null,
	UnprocessedItems: {
		'insert-Table1': [
			{
				PutRequest: {
					Item: {
						partitionKey: 'PK',
						sortKey: 'SK',
						name: 'name',
						lastname: 'lastname'
					}
				}
			}
		]
	}
};

const sandbox = sinon.createSandbox();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb !, 'batchWrite');
	updateStub.withArgs(fixture).returns(stubPromise(response));
	updateStub.withArgs(throttleFixture).onFirstCall().returns(stubPromise(throttleData));
	updateStub.withArgs(throttleFixture).onSecondCall().returns(stubPromise(throttleData));
	updateStub.withArgs(throttleFixture).onThirdCall().returns(stubPromise(throttleData));
	updateStub.withArgs(throttleFixture).returns(stubPromise(response));
	updateStub.returns(stubPromise(response));
});

test.after(() => {
	sandbox.restore();
});

test.serial('throws error if no items are passed', async t => {
	await t.throwsAsync(() => db.batchWrite().exec(), 'Items can not be empty.');
});

test.serial('throws error if more than 25 items are passed', async t => {
	const batchItems: PutRequest<number>[] = [];
	for (let i = 0; i < 26; i++) {
		batchItems.push(new PutRequest('test', i, i));
	}

	await t.throwsAsync(() => db.batchWrite(...batchItems).exec(), 'Can not insert more than 25 items at a time.');
});

test.serial('insert batch', async t => {
	await db.batchWrite(
		Table1.createBatchPutItem(
			{partitionKey: 'PK', sortKey: 'SK'},
			{name: 'name', lastname: 'lastname'}
		),
		Table1.createBatchPutItem(
			{partitionKey: 'PK', sortKey: 'SK23'},
			{name: 'name23', lastname: 'lastname23'}
		),
		Table2.createBatchDeleteItem(
			{partitionKey: 'PK2', sortKey: 'SK2'}
		),
		Table2.createBatchDeleteItem(
			{partitionKey: 'PK2', sortKey: 'SK3'}
		),
		Table2.createBatchPutItem(
			{partitionKey: 'PK', sortKey: 'SK'},
			{name: 'name', lastname: 'lastname'}
		)
	).exec();

	t.deepEqual(updateStub.callCount, 1);

	t.deepEqual(updateStub.lastCall.args[0], {
		RequestItems: {
			'insert-Table1': [
				{
					PutRequest: {
						Item: {
							partitionKey: 'PK',
							sortKey: 'SK',
							name: 'name',
							lastname: 'lastname'
						}
					}
				},
				{
					PutRequest: {
						Item: {
							partitionKey: 'PK',
							sortKey: 'SK23',
							name: 'name23',
							lastname: 'lastname23'
						}
					}
				}
			],
			'insert-Table2': [
				{
					DeleteRequest: {
						Key: {partitionKey: 'PK2', sortKey: 'SK2'}
					}
				},
				{
					DeleteRequest: {
						Key: {partitionKey: 'PK2', sortKey: 'SK3'}
					}
				},
				{
					PutRequest: {
						Item: {
							partitionKey: 'PK',
							sortKey: 'SK',
							name: 'name',
							lastname: 'lastname'
						}
					}
				}
			]
		}
	});
});

test.serial('program should use exponential backoff', async t => {
	const beforeCount = updateStub.callCount;

	await db.batchWrite(
		Table1.createBatchPutItem(
			{partitionKey: 'PK', sortKey: 'SK'},
			{name: 'name', lastname: 'lastname'}
		)
	).retry(4).exec();

	const afterCount = updateStub.callCount;

	t.deepEqual(afterCount - beforeCount, 4);

	const request = {
		RequestItems: {
			'insert-Table1': [
				{
					PutRequest: {
						Item: {
							partitionKey: 'PK',
							sortKey: 'SK',
							name: 'name',
							lastname: 'lastname'
						}
					}
				}
			]
		}
	};

	for (let i = 4; i > 0; i--) {
		t.deepEqual(updateStub.getCall(i).lastArg, request);
	}

	t.deepEqual(updateStub.lastCall.args[0], request);
});
