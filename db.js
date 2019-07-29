const util = require('util');
const mysql = require('mysql');
const config = require('./resources/connpoolconfig.json');

module.exports.connect = async function(db_name) {

var pool = mysql.createPool(config[db_name]);

	await pool.getConnection((err, connection) => {
		if(err) {
			console.error("An error occurred while connecting to the database");
			console.error("Err code: " + err.code);
		}

		if(connection) {
			connection.release();
			console.log(`MySQL Connected (${db_name})`);
		}
		return;
	});
	pool.query = await util.promisify(pool.query);
	return pool;
}