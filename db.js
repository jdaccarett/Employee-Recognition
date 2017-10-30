// Reference to mysql
var mysql = require('mysql');

var pool = mysql.createPool({

    connectionLimit : 10,
    host            : 'us-cdbr-iron-east-03.cleardb.net',
    user            : 'b8391048aec836',
    password        : '1518f015',
    database        : 'heroku_956de627ca379e5'

});

module.exports.pool = pool;
