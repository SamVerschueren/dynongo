import test from 'ava';
import sinon from 'sinon';
import db from '../..';
import {
	conditionalCheckFailedException,
	serviceUnavailableException,
	throttlingException
} from '../fixtures/aws-error';
import stubPromise from '../fixtures/stub-promise';

db.connect();

const Table = db.table('Table');

const fixtureWithRetry = {
	TableName: 'Table',
	ReturnValues: 'ALL_NEW',
	Key: {
		id: '200'
	},
	UpdateExpression: 'SET #k_foo=:v_foo',
	ExpressionAttributeNames: {
		'#k_foo': 'foo',
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_foo': 'bar',
		':v_id': '200'
	},
	ConditionExpression: '#k_id=:v_id'
};

const fixtureWithRetryAbort = {
	TableName: 'Table',
	ReturnValues: 'ALL_NEW',
	Key: {
		id: '422'
	},
	UpdateExpression: 'SET #k_foo=:v_foo',
	ExpressionAttributeNames: {
		'#k_foo': 'foo',
		'#k_id': 'id'
	},
	ExpressionAttributeValues: {
		':v_foo': 'bar',
		':v_id': '422'
	},
	ConditionExpression: '#k_id=:v_id'
};

const sandbox = sinon.createSandbox();
let updateStub;

test.before(() => {
	updateStub = sandbox.stub(db.dynamodb !, 'update');
	updateStub.withArgs(fixtureWithRetry).onFirstCall().returns(stubPromise(serviceUnavailableException));
	updateStub.withArgs(fixtureWithRetry).onSecondCall().returns(stubPromise(throttlingException));
	updateStub.withArgs(fixtureWithRetry).onThirdCall().returns(stubPromise({Attributes: 'foo'}));
	updateStub.withArgs(fixtureWithRetryAbort).returns(stubPromise(conditionalCheckFailedException));
	updateStub.returns(stubPromise({Attributes: 'foo'}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('should retry on error', async t => {
	updateStub.resetHistory();

	await t.notThrowsAsync(Table.update({id: '200'}, {$set: {foo: 'bar'}}).retry(3).exec());

	t.is(updateStub.callCount, 3);
});

test.serial('should abort retry when non-retryable error', async t => {
	updateStub.resetHistory();

	await t.throwsAsync(Table.update({id: '422'}, {$set: {foo: 'bar'}}).retry(3).exec(), conditionalCheckFailedException);

	t.is(updateStub.callCount, 1);
});

test.serial('single key update', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5'
		},
		ConditionExpression: '#k_id=:v_id'
	});
});

test.serial('multi key update', async t => {
	await Table.update({id: '5', email: 'foo@bar.com'}, {$set: {foo: 'bar'}}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5',
			email: 'foo@bar.com'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '#k_id=:v_id AND #k_email=:v_email'
	});
});

test.serial('multi key update ADD and SET', async t => {
	await Table.update({id: '5', email: 'foo@bar.com'}, {
		$set: {foo: 'bar'},
		$addToSet: {friends: 'bar@bar.com'}
	}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5',
			email: 'foo@bar.com'
		},
		UpdateExpression: 'SET #k_foo=:v_foo ADD #k_friends :v_friends',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email',
			'#k_friends': 'friends'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5',
			':v_email': 'foo@bar.com',
			':v_friends': db.dynamodb?.createSet(['bar@bar.com'])
		},
		ConditionExpression: '#k_id=:v_id AND #k_email=:v_email'
	});
});

test.serial('where', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}, $inc: {salary: 1000}}).where({email: 'foo@bar.com'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo, #k_salary=if_not_exists(#k_salary, :_v_empty_value)+:v_salary',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_salary': 'salary',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':_v_empty_value': 0,
			':v_foo': 'bar',
			':v_salary': 1000,
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (#k_email=:v_email)'
	});
});

test.serial('where with $or', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({$or: [{email: {$exists: false}}, {email: 'foo@bar.com'}]}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (attribute_not_exists(#k_email) OR #k_email=:v_email)'
	});
});

test.serial('where with $or and comparison', async t => {
	await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({
		foo: 'baz',
		$or: [{email: {$exists: false}}, {email: 'foo@bar.com'}]
	}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id',
			'#k_email': 'email'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar',
			':v_foo_1': 'baz',
			':v_id': '5',
			':v_email': 'foo@bar.com'
		},
		ConditionExpression: '(#k_id=:v_id) AND (#k_foo=:v_foo_1 AND (attribute_not_exists(#k_email) OR #k_email=:v_email))'
	});
});

test.serial('result', async t => {
	t.is(await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({email: 'foo@bar.com'}).exec(), 'foo');
});

test.serial('raw result', async t => {
	t.deepEqual(await Table.update({id: '5'}, {$set: {foo: 'bar'}}).where({email: 'foo@bar.com'}).raw().exec(), {Attributes: 'foo'});
});

test.serial('same field with null and value on conditional', async t => {
	await Table.update({id: '5'}, {$set: {foo: null}}).where({foo: 'bar'}).exec();

	t.deepEqual(updateStub.lastCall.args[0], {
		TableName: 'Table',
		ReturnValues: 'ALL_NEW',
		Key: {
			id: '5'
		},
		UpdateExpression: 'SET #k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo',
			'#k_id': 'id'
		},
		ExpressionAttributeValues: {
			':v_foo': null,
			':v_foo_1': 'bar',
			':v_id': '5'
		},
		ConditionExpression: '(#k_id=:v_id) AND (#k_foo=:v_foo_1)'
	});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.update({id: '5'}, {$set: {foo: 'bar'}}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
