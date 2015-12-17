import test from 'ava';
import db from '../';

test.before(() => {
	db.connect();
});

test('connect', t => {
	db.connect();

	t.notOk(db._prefix);
	t.is(db._delimiter, '.');
	t.ok(db._dynamodb);
	t.ok(db.raw);
});

test('connect options', t => {
	db.connect({prefix: 'dynongo', prefixDelimiter: ':'});

	t.is(db._prefix, 'dynongo');
	t.is(db._delimiter, ':');
	t.ok(db._dynamodb);
	t.ok(db.raw);
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
	t.ok(table._dynamodb);
});
