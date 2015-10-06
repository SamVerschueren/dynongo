# dynongo

[![Build Status](https://travis-ci.org/SamVerschueren/dynongo.svg)](https://travis-ci.org/SamVerschueren/dynongo)

> MongoDB like syntax for DynamoDB

## Installation

```bash
npm install --save dynongo
```

## Usage

### Connect

First of all, we have to connect with the database.

```javascript
var db = require('dynongo');

db.connect();
```

Please use IAM roles or environment variables to connect with the dynamodb database. This way, no keys have to
be embedded in your code. You can find more information on the [SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)
page.

If you still want to use embedded credentials, you can by providing an `accessKeyId`, `secretAccessKey` and an optional `region` property.

```javascript
db.connect({
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'us-west-1'
});
```

#### DynamoDB Local

It is possible to connect to a [local DynamoDB](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tools.DynamoDBLocal.html) database
by setting the `local` property to `true`. It will use port 8000 by default, but if you want to change that port, you can provide a `localPort` property.

```javascript
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

```javascript
db.connect({
    prefix: 'myapp-development',
    prefixDelimiter: '-'            // . if not provided
});
```

### Tables

In order for the developer to execute methods on a table, you have to retrieve the table object from the database.

```javascript
var Employee = db.table('Employee');
```

The table name will be automatically prefixed by the `prefix` provided in the connection object.

### Methods

#### find

```javascript
Q.fcall(function() {
    // Retrieve the first name and name from Amazon employees with a salary greater then $3000.
    return Employee.find({Organisation: 'Amazon'}).where({Salary: {$gt: 3000}}).select('FirstName Name').exec();
}).then(function(employees) {
    // Do something
    console.log(employees);
}).catch(function(err) {
    // handle the error
    console.error(err, err.message);
});
```

#### insert

```javascript
Q.fcall(function() {
    // Insert a new Amazon employee
    return Employee.insert({Organisation: 'Amazon', Email: 'foo.bar@amazon.com'}, {Title: 'CFO', FirstName: 'Foo', Name: 'Bar', Salary: 4500}).exec();
}).then(function(employee) {
    // Do something
    console.log(employee);
}).catch(function(err) {
    // handle the error
    console.error(err, err.message);
});
```

#### update

The first parameter in the `update` method is the primary key (hash + range) and the second method is a query that
defines the updates of the fields.

```javascript
Q.fcall(function() {
    // Increment the salary with $150 and set the job title to CTO.
    return Employee.update({Organisation: 'Amazon', Email: 'john.doe@amazon.com'}, {$set: {Title: 'CTO'}, $inc: {Salary: 150}}).exec();
}).then(function(employee) {
    // Do something
    console.log(employee);
}).catch(function(err) {
    // handle the error
    console.error(err, err.message);
});
```

If no Amazon employee exists with that email address exists, the method will fail.

#### remove

The remove method expects the primary key (hash + range) of the record to be removed.

```javascript
Q.fcall(function() {
    // Remove the employee with email john.doe@amazon.com that is an employee of Amazon
    return Employee.remove({Organisation: 'Amazon', Email: 'john.doe@amazon.com'}).exec();
}).then(function() {
    console.log('removed successfully');
}).catch(function(err) {
    // handle the error
    console.error(err, err.message);
});
```

### Create a table

A table can be created by either calling `create()` on a table instance or by calling `createTable` on the database instance.

The first way is by calling the `create()` method.

```javascript
// Retrieve the table instance
var Employee = db.table('Employee');

// Define the schema
var schema = {
    TableName: 'Employee',
    AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" }
    ],
    KeySchema: [
        { AttributeName: "id", KeyType: "HASH" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    }
};

// Drop the table
Employee.create(schema).exec()
    .then(function() {
        // The table is successfully created
    })
    .catch(function(err) {
        // Something went wrong when creating the table
    });
```

The second way is by calling the `createTable()` method.

```javascript
db.createTable(schema).exec()
    .then(function() {
        // The table is successfully created
    })
    .catch(function(err) {
        // Something went wrong when creating the table
    });
```

This is shorthand for the first method.

#### Awaiting the result

Creating a table can take a while. The previous examples do not wait for the action to be completed. But there
might be use cases where you have to wait untill the table is created entirely before continuing.
This can be done with the `await()` method.

```javascript
db.createTable(schema).await().exec()
    .then(function() {
        // The table is successfully created
    })
    .catch(function(err) {
        // Something went wrong when creating the table
    });
```

This will make sure the table is polled every 1000 milliseconds untill the status of the table is `active`. If you want to poll
at another speed, you can by providing the number of milliseconds in the `await` method.

```javascript
db.createTable(schema).await(5000).exec();
```

This will poll the status of the table every 5 seconds instead of every second.

### Drop a table

A table can be dropped by either calling `drop()` on a table instance or by calling `dropTable()` on the database instance.

The first way is by calling the `drop()` method.

```javascript
// Retrieve the table instance
var Employee = db.table('Employee');

// Drop the table
Employee.drop().exec()
    .then(function() {
        // The table is successfully dropped
    })
    .catch(function(err) {
        // Something went wrong when dropping the table
    });
```

The second way is by calling the `dropTable()` method.

```javascript
db.dropTable('Employee').exec()
    .then(function() {
        // The table is successfully dropped
    })
    .catch(function(err) {
        // Something went wrong when dropping the table
    });
```

This method is just a shorthand method for the first example.

#### Awaiting the result

Dropping a table can take a while, especially when the table has a lot of data. The previous examples do not wait for the action to be completed. But there
might be use cases where you have to wait untill the table is removed entirely before continuing. This can be done with the `await()` method.

```javascript
db.dropTable('Employee').await().exec()
    .then(function() {
        // The table is successfully dropped entirely
    })
    .catch(function(err) {
        // Something went wrong when dropping the table
    });
```

This will make sure the table is polled every 1000 milliseconds untill the table does not exist anymore. If you want to poll at another speed, you can by providing
the number of milliseconds in the `await` method.

```javascript
db.dropTable('Employee').await(5000).exec();
```

This will poll the status of the table every 5 seconds instead of every second.

## Contributors

- Sam Verschueren [<sam.verschueren@gmail.com>]

## License

MIT © Sam Verschueren
