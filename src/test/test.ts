import test from 'ava';
import db from '..';

test.before(() => {
	db.connect();
});

test('connect', t => {
	db.connect();

	t.falsy(db.prefix);
	t.is(db.delimiter, '.');
	t.truthy(db.dynamodb);
	t.truthy(db.raw);
	t.falsy(db.retries);
});

test('connect options', t => {
	db.connect({prefix: 'dynongo', prefixDelimiter: ':', retries: 3, httpOptions: {timeout: 5000}});

	t.is(db.prefix, 'dynongo');
	t.is(db.delimiter, ':');
	t.truthy(db.dynamodb);
	t.truthy(db.raw);
	t.deepEqual(db.retries, {
		factor: 1,
		maxTimeout: 2000,
		minTimeout: 300,
		randomize: true,
		retries: 3
	});
	t.deepEqual(db.raw?.config.httpOptions, {
		timeout: 5000
	});
});

test('connect with native retry options', t => {
	db.connect({maxRetries: 5, retryDelayOptions: {base: 500}});

	t.is(db.raw?.config.maxRetries, 5);
	t.deepEqual(db.raw?.config.retryDelayOptions, {base: 500});
});

test('connect locally', t => {
	db.connect({local: true});
	t.is((db.raw!).endpoint.href, 'http://localhost:8000/');

	db.connect({local: true, localPort: 9000});
	t.is((db.raw!).endpoint.href, 'http://localhost:9000/');
});

test('table', t => {
	const table = db.table('Table');

	t.is(table.name, 'Table');
	t.truthy(table['dynamodb']);
});

test('raw table', t => {
	db.connect({prefix: 'foo'});
	const table = db.table('Table', {raw: true});

	t.is(table.name, 'Table');
});

test('raw table method', t => {
	db.connect({prefix: 'foo'});
	const table = db.rawTable('Table');

	t.is(table.name, 'Table');
});
