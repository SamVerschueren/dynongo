import test from 'ava';
import db = require('../');

test.before(() => {
	db.connect();
});

test('connect', t => {
	db.connect();

	t.falsy(db.prefix);
	t.is(db.delimiter, '.');
	t.truthy(db.dynamodb);
	t.truthy(db.raw);
});

test('connect options', t => {
	db.connect({prefix: 'dynongo', prefixDelimiter: ':'});

	t.is(db.prefix, 'dynongo');
	t.is(db.delimiter, ':');
	t.truthy(db.dynamodb);
	t.truthy(db.raw);
});

test('connect locally', t => {
	db.connect({local: true});
	t.is(db.raw.endpoint.href, 'http://localhost:8000/');

	db.connect({local: true, localPort: 9000});
	t.is(db.raw.endpoint.href, 'http://localhost:9000/');
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
