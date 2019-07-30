const util = require('util');
const mysql = require('mysql');
const config = require('./resources/connpoolconfig.json');

class DBConnPool {

	constructor(db_name) {
		this.db_name = db_name;
		this.pool = mysql.createPool(config[db_name]);
	}

	async getConnection() {
		await this.pool.getConnection((err, connection) => {
			if(err) {
				console.error("An error occurred while connecting to the database");
				console.error("Err code: " + err.code);
			}

			if(connection) {
				connection.release();
				console.log(`MySQL Connected (${this.db_name})`);
			}
			return;
		});
		this.pool.query = await util.promisify(this.pool.query);
		return this.pool;
	}
}

module.exports = DBConnPool;
/*
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
*/