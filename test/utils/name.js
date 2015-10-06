import test from 'ava';
import name from '../../lib/utils/name';

// #generateKeyName
test('Simple name should generate correct result', t => {
    const result = name.generateKeyName('foo');

    t.is(result.Expression, '#k_foo');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo' });

    t.end();
});

test('foo.bar should generate two expression attribute names', t => {
    const result = name.generateKeyName('foo.bar');

    t.is(result.Expression, '#k_foo.#k_bar');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo', '#k_bar': 'bar' });

    t.end();
});

test('foo.bar.baz should generate three expression attribute names', t => {
    const result = name.generateKeyName('foo.bar.baz');

    t.is(result.Expression, '#k_foo.#k_bar.#k_baz');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo', '#k_bar': 'bar', '#k_baz': 'baz' });

    t.end();
});

test('Array name should generate correct result', t => {
    const result = name.generateKeyName('foo[0]');

    t.is(result.Expression, '#k_foo[0]');
    t.same(result.ExpressionAttributeNames, { '#k_foo': 'foo' });

    t.end();
});

// #generateValueName
test('Should generate a correct result name of it does not yet exist', t => {
    const result = name.generateValueName('foo', 'bar');

    t.is(result.Expression, ':v_foo');
    t.same(result.ExpressionAttributeValues, { ':v_foo': 'bar' });

    t.end();
});

test('Should generate a correct result name of it already exists, and the value is not the same', t => {
    const result = name.generateValueName('foo', 'bar', { ':v_foo': 'baz' });

    t.is(result.Expression, ':v_foo_1');
    t.same(result.ExpressionAttributeValues, { ':v_foo_1': 'bar' });

    t.end();
});

test('Should generate a correct result if the key refers to an array element', t => {
    const result = name.generateValueName('foo[0]', 'bar');

    t.is(result.Expression, ':v_foo_0_');
    t.same(result.ExpressionAttributeValues, { ':v_foo_0_': 'bar' });

    t.end();
});

test('Should generate a correct result if the value is an array', t => {
    const result = name.generateValueName('foo', ['bar', 'baz']);

    t.same(result.Expression, [':v_foo_0', ':v_foo_1']);
    t.same(result.ExpressionAttributeValues, { ':v_foo_0': 'bar', ':v_foo_1': 'baz' });

    t.end();
});

test('Should generate a correct result if the key refers to an array element and the value is an array', t => {
    const result = name.generateValueName('foo[0]', ['bar', 'baz']);

    t.same(result.Expression, [':v_foo_0__0', ':v_foo_0__1']);
    t.same(result.ExpressionAttributeValues, { ':v_foo_0__0': 'bar', ':v_foo_0__1': 'baz' });

    t.end();
});