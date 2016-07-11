import test from 'ava';
import db from '../';

test.before(() => {
	db.connect();
});

test('connect', t => {
	db.connect();

	t.falsy(db._prefix);
	t.is(db._delimiter, '.');
	t.truthy(db._dynamodb);
	t.truthy(db.raw);
});

test('connect options', t => {
	db.connect({prefix: 'dynongo', prefixDelimiter: ':'});

	t.is(db._prefix, 'dynongo');
	t.is(db._delimiter, ':');
	t.truthy(db._dynamodb);
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

	t.is(table._name, 'Table');
	t.truthy(table._dynamodb);
});
