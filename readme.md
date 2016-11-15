# dynongo

[![Build Status](https://travis-ci.org/SamVerschueren/dynongo.svg)](https://travis-ci.org/SamVerschueren/dynongo)
[![Coverage Status](https://coveralls.io/repos/SamVerschueren/dynongo/badge.svg?branch=master&service=github)](https://coveralls.io/github/SamVerschueren/dynongo?branch=master)

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
Employee.findOne({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).select('FirstName Name').exec()
    .then(employees => {
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


## License

MIT © [Sam Verschueren](https://github.com/SamVerschueren)
