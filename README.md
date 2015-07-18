# dynongo

> MongoDB like syntax for DynamoDB

## Methods

### Find

The find method expects the key condition. If you want to find records with a Global Secondary Index, you can pass the name
of the index as second argument.

```javascript
Q.fcall(function() {
    // Retrieve all the employees from Amazon
    return Employee.find({organisation: 'Amazon'}).exec();
}).then(function(employees) {
    // Do something
    console.log(employees);
}).catch(function(err) {
    // handle the error
    console.error(err, err.message);
});
```

If you only want the `FirstName` and `Name` of the employees, you can use the `select` method.

```javascript
Employee.find({organisation: 'Amazon'}).select('FirstName, Name').exec();
```

Or if you want to filter on more fine grained on other fields, for example if you want to retrieve all the employees
with a salary greater then $3000.

```javascript
Employee.find({organisation: 'Amazon'}).where({salary: {$gt: 3000}}).select('FirstName, Name').exec();
```

## Contributors

- Sam Verschueren [<sam.verschueren@gmail.com>]

## License

MIT © Sam Verschueren
