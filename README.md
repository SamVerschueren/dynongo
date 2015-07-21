# dynongo

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

// Connect with dynamodb in the us-west-1 region
db.connect({
    region: 'us-west-1'
});
```

Please use IAM roles or environment variables to connect with the dynamodb database. This way, no keys have to
be embedded in your code.

If you still want to use embedded keys, you can by providing an `accessKeyId` and `secretAccessKey` property.

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
    region: 'us-west-1',
    local: true,
    localPort: 4444                 // 8000 if not provided
});
```

#### Prefixing tables

It's a good thing to prefix the tables with the name of the project and maybe the environment like production or staging. Instead
of always repeating those names every time you want to query the table, you can provide the prefix and prefix delimiter once. The
default delimiter is the `.`.

```javascript
db.connect({
    region: 'us-west-1',
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

## Contributors

- Sam Verschueren [<sam.verschueren@gmail.com>]

## License

MIT © Sam Verschueren
