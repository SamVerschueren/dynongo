'use strict';

// module dependencies
var test = require('ava'),
    assert = require('assert'),
    query = require('../../lib/utils/query');

test('Should parse an object with one object', function (t) {
    var result = query.parse({ id: 5 });

    t.is(result.ConditionExpression, '#k_id=:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$eq', function (t) {
    var result = query.parse({ id: { $eq: 5 } });

    t.is(result.ConditionExpression, '#k_id=:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$gt', function (t) {
    var result = query.parse({ id: { $gt: 5 } });

    t.is(result.ConditionExpression, '#k_id>:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$gte', function (t) {
    var result = query.parse({ id: { $gte: 5 } });

    t.is(result.ConditionExpression, '#k_id>=:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$lt', function (t) {
    var result = query.parse({ id: { $lt: 5 } });

    t.is(result.ConditionExpression, '#k_id<:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$lte', function (t) {
    var result = query.parse({ id: { $lte: 5 } });

    t.is(result.ConditionExpression, '#k_id<=:v_id');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5 });

    t.end();
});

test('$contains', function (t) {
    var result = query.parse({ array: { $contains: 5 } });

    t.is(result.ConditionExpression, 'contains(#k_array, :v_array)');
    t.same(result.ExpressionAttributeNames, { '#k_array': 'array' });
    t.same(result.ExpressionAttributeValues, { ':v_array': 5 });

    t.end();
});

test('$beginsWith', function (t) {
    var result = query.parse({ foo: { $beginsWith: 'bar' } });

    t.is(result.ConditionExpression, 'begins_with(#k_foo, :v_foo)');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo' });
    t.same(result.ExpressionAttributeValues, { ':v_foo': 'bar' });

    t.end();
});

test('$beginsWith should parse a number to a string', function (t) {
    var result = query.parse({ foo: { $beginsWith: 5 } });

    console.log(result);

    t.is(result.ConditionExpression, 'begins_with(#k_foo, :v_foo)');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo' });
    assert.deepStrictEqual(result.ExpressionAttributeValues, { ':v_foo': '5' });

    t.end();
});

test('Should parse an object with two properties', function (t) {
    var result = query.parse({ id: 5, foo: 'bar' });

    t.is(result.ConditionExpression, '#k_id=:v_id AND #k_foo=:v_foo');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id', '#k_foo': 'foo' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5, ':v_foo': 'bar' });

    t.end();
});

test('Should parse an $and expression', function (t) {
    var result = query.parse({ $and: [{ id: 5 }, { id: 8 }] });

    t.is(result.ConditionExpression, '(#k_id=:v_id AND #k_id=:v_id_1)');
    t.same(result.ExpressionAttributeNames, { '#k_id': 'id' });
    t.same(result.ExpressionAttributeValues, { ':v_id': 5, ':v_id_1': 8 });

    t.end();
});