const util = require('util');
const mysql = require('mysql');
const config = require('./resources/connpoolconfig.json');

var pool = mysql.createPool(config);

pool.getConnection((err, connection) => {
	if(err) {
		console.error("An error occurred while connecting to the database");
		console.error("Err code: " + err.code);
	}

	if(connection) {
		connection.release();
		console.log("MySQL Connected");
	}
	return;
});
pool.query = util.promisify(pool.query);

module.exports = pool;