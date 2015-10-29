import test from 'ava';
import query from '../../lib/utils/query';

test('Should throw an error if the value is undefined', t => {
	t.throws(query.parse.bind(query, {id: undefined}), 'Value for key \'id\' is undefined. Please provide a valid value.');

	t.end();
});

test('Should throw an error if the value of a sub property is undefined', t => {
	t.throws(query.parse.bind(query, {foo: {$gt: undefined}}), 'Value for key \'foo\' is undefined. Please provide a valid value.');

	t.end();
});

test('Should parse an object with one object', t => {
	const result = query.parse({id: 5});

	t.is(result.ConditionExpression, '#k_id=:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$eq', t => {
	const result = query.parse({id: {$eq: 5}});

	t.is(result.ConditionExpression, '#k_id=:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$gt', t => {
	const result = query.parse({id: {$gt: 5}});

	t.is(result.ConditionExpression, '#k_id>:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$gte', t => {
	const result = query.parse({id: {$gte: 5}});

	t.is(result.ConditionExpression, '#k_id>=:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$lt', t => {
	const result = query.parse({id: {$lt: 5}});

	t.is(result.ConditionExpression, '#k_id<:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$lte', t => {
	const result = query.parse({id: {$lte: 5}});

	t.is(result.ConditionExpression, '#k_id<=:v_id');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5});

	t.end();
});

test('$in should throw an error if it is not an array', t => {
	t.throws(query.parse.bind(query, {id: {$in: 1}}), 'Please provide an array of elements for the $in operator.');

	t.end();
});

test('$nin should throw an error if it is not an array', t => {
	t.throws(query.parse.bind(query, {id: {$nin: 1}}), 'Please provide an array of elements for the $nin operator.');

	t.end();
});

test('$in', t => {
	const result = query.parse({id: {$in: [1, 2, 3]}});

	t.is(result.ConditionExpression, '#k_id IN (:v_id_0,:v_id_1,:v_id_2)');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id_0': 1, ':v_id_1': 2, ':v_id_2': 3});

	t.end();
});

test('$nin', t => {
	const result = query.parse({id: {$nin: [1, 2, 3]}});

	t.is(result.ConditionExpression, 'NOT #k_id IN (:v_id_0,:v_id_1,:v_id_2)');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id_0': 1, ':v_id_1': 2, ':v_id_2': 3});

	t.end();
});

test('$contains', t => {
	const result = query.parse({array: {$contains: 5}});

	t.is(result.ConditionExpression, 'contains(#k_array, :v_array)');
	t.same(result.ExpressionAttributeNames, {'#k_array': 'array'});
	t.same(result.ExpressionAttributeValues, {':v_array': 5});

	t.end();
});

test('$exists is set to 1', t => {
	const result = query.parse({foo: {$exists: 1}});

	t.is(result.ConditionExpression, 'attribute_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$exists is set to true', t => {
	const result = query.parse({foo: {$exists: true}});

	t.is(result.ConditionExpression, 'attribute_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$exists is set to 0', t => {
	const result = query.parse({foo: {$exists: 0}});

	t.is(result.ConditionExpression, 'attribute_not_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$exists is set to false', t => {
	const result = query.parse({foo: {$exists: false}});

	t.is(result.ConditionExpression, 'attribute_not_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$exists is set to -1 should check for not exists', t => {
	const result = query.parse({foo: {$exists: -1}});

	t.is(result.ConditionExpression, 'attribute_not_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$exists is set to 2 should check for not exists', t => {
	const result = query.parse({foo: {$exists: 2}});

	t.is(result.ConditionExpression, 'attribute_not_exists(#k_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {});

	t.end();
});

test('$beginsWith', t => {
	const result = query.parse({foo: {$beginsWith: 'bar'}});

	t.is(result.ConditionExpression, 'begins_with(#k_foo, :v_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {':v_foo': 'bar'});

	t.end();
});

test('$beginsWith should parse a number to a string', t => {
	const result = query.parse({foo: {$beginsWith: 5}});

	t.is(result.ConditionExpression, 'begins_with(#k_foo, :v_foo)');
	t.same(result.ExpressionAttributeNames, {'#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {':v_foo': '5'});

	t.end();
});

test('Should parse an object with two properties', t => {
	const result = query.parse({id: 5, foo: 'bar'});

	t.is(result.ConditionExpression, '#k_id=:v_id AND #k_foo=:v_foo');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id', '#k_foo': 'foo'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5, ':v_foo': 'bar'});

	t.end();
});

test('$or', t => {
	const result = query.parse({$or: [{id: 5}, {id: 8}]});

	t.is(result.ConditionExpression, '(#k_id=:v_id OR #k_id=:v_id_1)');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5, ':v_id_1': 8});

	t.end();
});

test('$or throws error', t => {
	try {
		query.parse({$or: {id: 5}});
	} catch (err) {
		t.is(err.message, 'Invalid expression $or. Value should be an array.');
		t.end();
	}
});

test('$and', t => {
	const result = query.parse({$and: [{id: 5}, {id: 8}]});

	t.is(result.ConditionExpression, '(#k_id=:v_id AND #k_id=:v_id_1)');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5, ':v_id_1': 8});

	t.end();
});

test('$and throws error', t => {
	try {
		query.parse({$and: {id: 5}});
	} catch (err) {
		t.is(err.message, 'Invalid expression $and. Value should be an array.');
		t.end();
	}
});
