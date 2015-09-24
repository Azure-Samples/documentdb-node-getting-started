var documentClient = require("documentdb").DocumentClient;
var config = require("./config");

var client = new documentClient(config.endpoint, {"masterKey": config.authKey});

var getOrCreateDatabase = function(callback) {
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: config.dbDefinition.id
        }]
    };

    client.queryDatabases(querySpec).toArray(function(err, results) {
        if(err) return callback(err);

        if (results.length === 0) {
            client.createDatabase(config.dbDefinition, function(err, created) {
                if(err) return callback(err);

                callback(null, created);
            });
        }
        else {
            callback(null, results[0]);
        }
    });
};

var getOrCreateCollection = function(callback) {

    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: config.collDefinition.id
        }]
    };

    var dbUri = "dbs/" + config.dbDefinition.id;

    client.queryCollections(dbUri, querySpec).toArray(function(err, results) {
        if(err) return callback(err);

        if (results.length === 0) {
            client.createCollection(dbUri, config.collDefinition, function(err, created) {
                if(err) return callback(err);
                callback(null, created);
            });
        }
        else {
            callback(null, results[0]);
        }
    });
};

var getOrCreateDocument = function(document, callback) {
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: document.id
        }]
    };

    var collectionUri = "dbs/" + config.dbDefinition.id + "/colls/" + config.collDefinition.id;

    client.queryDocuments(collectionUri, querySpec).toArray(function(err, results) {
        if(err) return callback(err);

        if(results.length === 0) {
            client.createDocument(collectionUri, document, function(err, created) {
                if(err) return callback(err);

                callback(null, created);
            });
        } else {
            callback(null, results[0]);
        }
    });
};

var queryCollection = function(documentId, callback) {
  var querySpec = {
      query: 'SELECT * FROM root r WHERE r.id=@id',
      parameters: [{
          name: '@id',
          value: documentId
      }]
  };

  var collectionUri = "dbs/" + config.dbDefinition.id + "/colls/" + config.collDefinition.id;

  client.queryDocuments(collectionUri, querySpec).toArray(function(err, results) {
      if(err) return callback(err);

      callback(null, results);
  });
};

// WARNING: this function will delete your database and all its children resources: collections and documents
function cleanup(callback) {
    client.deleteDatabase("dbs/" + config.dbDefinition.id, function(err) {
        if(err) return callback(err);

        callback(null);
    });
}

getOrCreateDatabase(function(err, db) {
    if(err) return console.log(err);
    console.log('Read or created db:\n' + db.id + '\n');

    getOrCreateCollection(function(err, coll) {
        if(err) return console.log(err);
        console.log('Read or created collection:\n' + coll.id + '\n');

        getOrCreateDocument(config.docsDefinitions.Andersen, function(err, doc) {
            if(err) return console.log(err);
            console.log('Read or created document:\n' + doc.id + '\n');

            getOrCreateDocument(config.docsDefinitions.Wakefield, function(err, doc) {
                if(err) return console.log(err);
                console.log('Read or created document:\n' + doc.id + '\n');

                queryCollection("AndersenFamily", function(err, results) {
                    if(err) return console.log(err);
                    console.log('Query results:\n' + JSON.stringify(results, null, '\t') + '\n');

                    cleanup(function(err) {
                        if(err) return console.log(err);
                        console.log('Done.');
                    });
                });
            });
        });
    });
});
