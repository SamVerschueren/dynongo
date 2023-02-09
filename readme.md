# dynongo

![CI](https://github.com/SamVerschueren/dynongo/workflows/CI/badge.svg) [![codecov](https://codecov.io/gh/SamVerschueren/dynongo/badge.svg?branch=master)](https://codecov.io/gh/SamVerschueren/dynongo?branch=master)
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

#### Credentials

Please use IAM roles or environment variables to connect with the dynamodb database. This way, no keys have to
be embedded in your code. You can find more information on the [SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)
page.

If you still want to use embedded credentials, you can by providing an `accessKeyId`, `secretAccessKey` and an optional `region` property.

```js
db.connect({
	accessKeyId: 'AKIAI44QH8DHBEXAMPLE',
	secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
	region: 'us-west-1'
});
```

Or if you rather work with [temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html), you can do that as well.

```js
db.connect({
	accessKeyId: 'AKIAI44QH8DHBEXAMPLE',
	secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
	sessionToken: 'AQoDYXdzEJr...<remainder of security token>',
	region: 'us-west-1'
});
```

#### Retry

The retry configuration can be passed during initialisation, or per individual query. The mechanism is based on [`p-retry`](https://github.com/sindresorhus/p-retry) and requires the same [options](https://github.com/tim-kos/node-retry#retryoperationoptions). Configuring retry will allow the user to automatically retry the DynamoDB operation if it's a retryable error.

```js
db.connect({
	retries: {
		retries: 3,
		factor: 1,
		randomize: false
	}
})
```

You can simply pass a number as well when you don't want to configure the retry strategy.

```js
db.connect({
	retries: 3
})
```

As an alternative, the internal retry behaviour of the AWS SDK can also be used by setting [`maxRetries`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#maxRetries-property) and [`retryDelayOptions`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#retryDelayOptions-property).

```js
db.connect({
	maxRetries: 3,
	retryDelayOptions: { base: 300 }
})
```

As this setting is global, it cannot be overridden at the method level.

Note that it may not advisable to use both `dynongo`'s retry logic and enable the AWS SDK retry behaviour at the same time. If both are enabled, the AWS SDK retry behaviour will trigger first and if the failure persists, the built-in logic inside `dynongo` will keep retrying the failing method.

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

Every method can override the retry [options](https://github.com/tim-kos/node-retry#retryoperationoptions) passed with the `.connect()` method or can customise the retry configuration for the specific method.

```js
Employee
	.find({Organisation: 'Amazon'})
	.where({Salary: {$gt: 3000}})
	.select('FirstName Name')
	.retry({retries: 3, factor: 1, randomize: false})
	.exec()
	.then(employees => {
		// => [{FirstName: 'Foo', Name: 'Bar'}]
	});
```

If you don't want to configure the retry strategy, you can simply pass the number of retries.

```js
Employee
	.find({Organisation: 'Amazon'})
	.where({Salary: {$gt: 3000}})
	.select('FirstName Name')
	.retry(2)
	.exec()
	.then(employees => {
		// => [{FirstName: 'Foo', Name: 'Bar'}]
	});
```

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
Employee.insert({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {Title: 'CFO', HiredAt: 'last year', FirstName: 'Foo', Name: 'Bar', Salary: 4500}).exec()
	.then(employee => {
		// => {FirstName: 'Foo', Name: 'Bar', Salary: 4500, Title: 'CFO', HiredAt: 'last year', Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}
	});
```

#### update

The first parameter in the `update` method is the primary key (hash + range) and the second method is a query that
defines the updates of the fields.

You can use `$set: { field: { $ifNotExists: value } }` to only set the value if the field does not exists on the record

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$set: {Title: 'CTO', HiredAt: {$ifNotExists: 'today'}}, $inc: {Salary: 150}, $push: {Hobby: {$each: ['swimming', 'walking']}}}).exec()
	.then(employee => {
		// => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', HiredAt: 'last year', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['cycling', 'swimming', 'walking']}
	});
```

Or, if working with [Sets](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypes.SetTypes) you can use `$addToSet` to add unique values to a Set, it supports single value, arrays and `$each` operator.

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$addToSet: {Departments: ['IT', 'IT', 'HR']}}).exec()
	.then(employee => {
		// => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['cycling', 'swimming', 'walking'], Departments: ['IT', 'HR']}
	});
```

You can use `$removeFromSet` to remove one, or many elements from sets

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$removeFromSet: {Departments: ['IT']}}).exec()
	.then(employee => {
		// => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['cycling', 'swimming', 'walking'], Departments: ['HR']}
	});
```

You can use `$unshift` to prepend a list with one or multiple values.

```js
Employee.update({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {$unshift: {Hobby: 'programming'}}).exec()
	.then(employee => {
		// => {FirstName: 'Foo', Name: 'Bar', Salary: 4650, Title: 'CTO', Organisation: 'Amazon', Email: 'foo.bar@amazon.com', Hobby: ['programming', 'cycling', 'swimming', 'walking'], Departments: ['IT']}
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

### Read consistency

By default, all reads are eventually consistent which means the response migh include some stale data.

When you request a strongly consistent read, DynamoDB returns a response with the most up-to-date data, reflecting the updates from all prior write operations that were successful.

Dynongo supports strongly consistent reads by adding the `.consistent()` chaining operator.

```js
Employee
	.find({Organisation: 'Amazon'})
	.where({Salary: {$gt: 3000}})
	.select('FirstName Name')
	.consistent()
	.exec()
	.then(employees => {
		// => [{FirstName: 'Foo', Name: 'Bar'}]
	});
```

More information can be found in the [AWS documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html).

### Batch Write

The BatchWriteItem operation puts or deletes multiple items in one or more tables. A single call to BatchWrite can write up to 16 MB of data, which can comprise as many as 25 put or delete requests. Individual items to be written can be as large as 400 KB.


You can create Put and Delete request by calling the method on Table with the correct parameters.
```js
const result = await db.batchWrite(
	Table1.createBatchPutItem(
		{partitionKey: 'PK', sortKey: 'SK'},
		{name: 'Sander', lastname: 'Machado'}
	),
	Table1.createBatchPutItem(
		{partitionKey: 'PK', sortKey: 'SK23'},
		{name: 'Sander', lastname: 'Doe'}
	),
	Table2.createBatchDeleteItem(
		{partitionKey: '123', sortKey: '456'}
	),
	Table2.createBatchDeleteItem(
		{partitionKey: 'PK2', sortKey: 'SK3'}
	),
	Table2.createBatchPutItem(
		{partitionKey: 'PK', sortKey: 'SK'},
		{name: 'name', lastname: 'lastname'}
	)
).exec();
```

### Transactions

The library also supports transactions. Transactions simplify the developer experience of making coordinated, all-or-nothing changes to multiple items both within and across tables. You can only provide up to 10 transaction requests per transaction.

#### Read Transactions

```ts
import dynongo from 'dynongo';

const result = await dynongo
	.transactRead(
		dynongo.table('User')
			.find({Id: '1234', Key: 'BankRoll'}),
		dynongo.table('BankAccount')
			.find({Key: 'Salary'})
	)
	.exec();

//=> [{Id: '1234', Key: 'BankRoll', Value: 100}, {Key: 'Salary', Value: 1500}]
```

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
