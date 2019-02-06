# dynongo

[![Build Status](https://travis-ci.org/SamVerschueren/dynongo.svg)](https://travis-ci.org/SamVerschueren/dynongo)
[![codecov](https://codecov.io/gh/SamVerschueren/dynongo/branch/master/graph/badge.svg)](https://codecov.io/gh/SamVerschueren/dynongo)

> MongoDB like syntax for [DynamoDB](https://aws.amazon.com/dynamodb/)


## Installation

```
npm install --save dynongo
```


## Usage

### Connect

First of all, we have to connect with the database.

```js
const db = require('dynongo');

db.connect();
```

Please use IAM roles or environment variables to connect with the dynamodb database. This way, no keys have to
be embedded in your code. You can find more information on the [SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)
page.

If you still want to use embedded credentials, you can by providing an `accessKeyId`, `secretAccessKey` and an optional `region` property.

```js
db.connect({
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'us-west-1'
});
```

#### DynamoDB Local

It is possible to connect to a [local DynamoDB](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tools.DynamoDBLocal.html) database
by setting the `local` property to `true`. It will use port 8000 by default, but if you want to change that port, you can provide a `localPort` property.

```js
db.connect({
    local: true,
    host: '192.168.5.5',            // localhost if not provided
    localPort: 4444                 // 8000 if not provided
});
```

#### Prefixing tables

It's a good thing to prefix the tables with the name of the project and maybe the environment like production or staging. Instead
of always repeating those names every time you want to query the table, you can provide the prefix and prefix delimiter once. The
default delimiter is the `.`.

```js
db.connect({
    prefix: 'myapp-development',
    prefixDelimiter: '-'            // . if not provided
});
```

### Tables

In order for the developer to execute methods on a table, you have to retrieve the table object from the database.

```js
const Employee = db.table('Employee');
```

The table name will be automatically prefixed by the `prefix` provided in the connection object.

If you provided a `prefix` in the connection object but you don't want that for a specific table, you could ask for a raw table. A raw table is like a regular table without the prefix.

```js
const Employee = db.rawTable('Employee');
```

### Methods

#### find

```js
Employee.find({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).select('FirstName Name').exec()
    .then(employees => {
        // => [{FirstName: 'Foo', Name: 'Bar'}]
    });
```

#### findOne

```js
Employee.findOne({Organisation: 'Amazon'}).where({Salary: {$between: [3000, 4000]}}).select('FirstName Name').exec()
    .then(employee => {
        // => {FirstName: 'Foo', Name: 'Bar'}
    });
```

#### count

```js
Employee.find({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).count().exec()
    .then(count => {
        // => 8
    });
```

#### insert

```js
 Employee.insert({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {Title: 'CFO', FirstName: 'Foo', Name: 'Bar', Salary: 4500}).exec()
    .then(employee => {
        // => {FirstName: 'Foo', Name: 'Bar', Salary: 4500, Title: 'CFO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}
    });
```

#### update

The first parameter in the `update` method is the primary key (hash + range) and the second method is a query that
defines the updates of the fields.

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$set: {Title: 'CTO'}, $inc: {Salary: 150}, $push: {Hobby: {$each: ['swimming', 'walking']}}}).exec()
    .then(employee => {
        // => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['cycling', 'swimming', 'walking']}
    });
```

You can use `$unshift` to prepend a list with one or multiple values.

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$unshift: {Hobby: 'programming'}}}).exec()
    .then(employee => {
        // => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['programming', 'cycling', 'swimming', 'walking']}
    });
```

If no Amazon employee exists with that email address exists, the method will fail.

You can also add extra conditions, for instance if we want to increase the salary by $150 only if the current salary is less then $4500.

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$inc: {Salary: 150}}).where({Salary: {$lt: 4500}}).exec()
    .catch(err => {
        // ConditionalCheckFailedException: The conditional request failed
    });
```

#### remove

The remove method expects the primary key (hash + range).

```js
Employee.remove({Organisation: 'Amazon', Email: 'john.doe@amazon.com'}).exec()
    .then(() => {
        // => removed
    });
```

#### findOneAndRemove

This method is the same as the `remove` method, except that it will return the removed record..

```js
Employee.findOneAndRemove({Organisation: 'Amazon', Email: 'john.doe@amazon.com'}).exec()
    .then(result => {
        // => {Organisation: 'Amazon', Email: 'john.doe@amazon.com'}
    });
```

### Transactions

The library also supports transactions.

#### Read Transactions

#### Write Transactions

For instance, what if we want to increment the bankroll of a user, but only if we still have enough money on our own back account.

```ts
import dynongo from 'dynongo';

await dynongo
	.transactWrite(
		dynongo.table('User')
			.update({Id: '1234', Key: 'BankRoll'}, {$inc: {Amount: 150}})
	)
	.withConditions(
		dynongo.table('BankAccount')
			.find({Key: 'Salary'})
			.where({value: {$gte: 150}})
	)
	.exec();
```

> **note** You can only provide up to 10 transaction requests per transaction. The previous example uses 2.

### List all the tables

You can retrieve a list of all the tables.

```js
db.listTables().exec().then(tables => {
	console.log(tables);
	//=> ['foo', 'bar', 'baz']
});
```

If you passed in a `prefix` property in the connection object, only the tables with that prefix will
be returned.

### Paging

You can implement paging by using the `startFrom()` method together with the `LastEvaluatedKey` property returned when using the `raw()` method.

```js
const result = Employee.find({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).limit(1).raw().exec()
    .then(result => {
        /**
		 * {
		 *     "Items": [
		 *         { UserId: '1', FirstName: 'Foo', Name: 'Bar' }
		 *     ],
		 *     "Count": 1,
		 *     "ScannedCount": 1,
		 *     "LastEvaluatedKey": {
		 *         Organisation: 'Amazon',
		 *         UserId: '1'
		 *     }
		 * }
		 */

		// Retrieve the next page
		return Employee.find({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).startFrom(result.LastEvaluatedKey).limit(1).raw().exec()
	})
	.then(result => {
        /**
		 * {
		 *     "Items": [
		 *         { UserId: '2', FirstName: 'Unicorn', Name: 'Rainbow' }
		 *     ],
		 *     "Count": 1,
		 *     "ScannedCount": 1,
		 *     "LastEvaluatedKey": {
		 *         Organisation: 'Amazon',
		 *         UserId: '2'
		 *     }
		 * }
		 */
	});
```

You can also use [dynongo-pager](https://github.com/SamVerschueren/dynongo-pager) to make paging even easier.

### Create a table

A table can be created by either calling `create()` on a table instance or by calling `createTable` on the database instance.

The first way is by calling the `create()` method.

```js
const Employee = db.table('Employee');

const schema = {
    TableName: 'Employee',
    AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
    ],
    KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    }
};

Employee.create(schema).exec()
    .then(() => {
        // => Table is being created
    });
```

The second way is by calling the `createTable()` method.

```js
db.createTable(schema).exec()
    .then(() => {
        // Table is being created
    });
```

This is shorthand for the first method.

#### Awaiting the result

Creating a table can take a while. The previous examples do not wait for the action to be completed. But there
might be use cases where you have to wait untill the table is created entirely before continuing.
This can be done with the `wait()` method.

```js
db.createTable(schema).wait().exec()
    .then(() => {
        // Table is created
    });
```

This will make sure the table is polled every 1000 milliseconds untill the status of the table is `active`. If you want to poll
at another speed, you can by providing the number of milliseconds in the `wait` method.

```js
db.createTable(schema).wait(5000).exec();
```

This will poll the status of the table every 5 seconds instead of every second.

### Drop a table

A table can be dropped by either calling `drop()` on a table instance or by calling `dropTable()` on the database instance.

The first way is by calling the `drop()` method.

```js
const Employee = db.table('Employee');

Employee.drop().exec()
    .then(() => {
        // => Table is being dropped
    });
```

The second way is by calling the `dropTable()` method.

```js
db.dropTable('Employee').exec()
    .then(() => {
        // => Table is being dropped
    })
```

This method is just a shorthand method for the first example.

#### Awaiting the result

Dropping a table can take a while, especially when the table has a lot of data. The previous examples do not wait for the action to be completed. But there
might be use cases where you have to wait untill the table is removed entirely before continuing. This can be done with the `wait()` method.

```js
db.dropTable('Employee').wait().exec()
    .then(() => {
        // => Table is dropped
    })
```

This will make sure the table is polled every 1000 milliseconds untill the table does not exist anymore. If you want to poll at another speed, you can by providing
the number of milliseconds in the `wait` method.

```js
db.dropTable('Employee').wait(5000).exec();
```

This will poll the status of the table every 5 seconds instead of every second.


## Related

- [dynongo-pager](https://github.com/SamVerschueren/dynongo-pager) - Easy paging for DynamoDB with dynongo


## License

MIT © [Sam Verschueren](https://github.com/SamVerschueren)
