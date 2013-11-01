module.exports = function (settings) {
  var async = require('async');
  var AWS = require('aws-sdk');
  var dynamo = new AWS.DynamoDB(settings.aws);

  function listTables(callback) {
    dynamo.client.listTables(function (err, tables) {
      callback(err, tables.TableNames);
    });
  }
  
  function describeTable(tableName, callback) {
    var options = {TableName: tableName};
    
    dynamo.client.describeTable(options, function(err, data) {
      callback(err, data.Table);
    });
  }
  
  function countItems(tableName, callback) {
    describeTable(tableName, function(err, data) {
      if (err) return callback(err);
      
      callback(err, data.ItemCount)
    })
  }
  
  function createTable(definition, callback) {
    dynamo.client.createTable(definition, function(err, data) {
      if (err) return callback(err);
      
      callback(err, data.TableDescription);
    });
  }
  
  function deleteTable(tableName, callback) {
    var options = {TableName: tableName};
    
    dynamo.client.deleteTable(options, function(err, data) {
      if (err) return;
      
      callback(err, data.TableDescription);
    });
  }
  
  function dumpTable(tableName, callback) {
    var totalData = [];
    var scan = function(options) {
      dynamo.client.scan(options, function(err, data) {
        if (err) return callback(err);

        totalData = totalData.concat(data.Items);
        
        if (!data.LastEvaluatedKey) {
          setImmediate(callback, null, totalData);
        } else {
          options.ExclusiveStartKey = data.LastEvaluatedKey;
          setImmediate(scan, options);
        }
      });
    };

    scan({TableName: tableName});
  }
  
  function truncateTable(tableName, callback) {
    
    describeTable(tableName, function(describeError, schema) {
      if (describeError) return callback(describeError);
      
      dumpTable(tableName, function(dumpError, dump) {
        if (dumpError) return callback(dumpError);
  
        var batches = [];
        while (dump.length > 0) {
          batches[batches.length] = dump.splice(0, 25);
        }
  
        var deleteTask = function(batch, batchCallback) {
          var deleteOptions = {
            RequestItems: {}
          };
          
          deleteOptions["RequestItems"][tableName] = batch.map(function(item) {

            var key = {};
            schema.KeySchema.forEach(function(keyItem) {
              key[keyItem.AttributeName] = item[keyItem.AttributeName];
            });
            
            return {
              DeleteRequest: {
                Key: key
              }
            }
          });
  
          dynamo.client.batchWriteItem(deleteOptions, batchCallback);
        };
        
        async.map(batches, deleteTask, callback);
      });
    });
  }

  function setProvisionedThroughput(table, read, write, callback) {
    var options = {
      "ProvisionedThroughput": {
        "ReadCapacityUnits": read,
        "WriteCapacityUnits": write
      },
      "TableName": table
    };

    dynamo.client.updateTable(options, callback);
  }

  return {
    listTables: listTables,
    describeTable: describeTable,
    countItems: countItems,
    createTable: createTable,
    deleteTable: deleteTable,
    dumpTable: dumpTable,
    truncateTable: truncateTable,
    setProvisionedThroughput: setProvisionedThroughput
  };
};
