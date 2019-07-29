var db = require('./db');

module.exports.connect = async function(db_name) {
	conn = await db.connect(db_name);
}

/*
Adds a new record to the quotes table under the given chatter
*/
module.exports.addQuote = async function(quote, chatter) {
	try {
		var chatter_id = await this.getChatterID(chatter);
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`INSERT INTO quotes (quote,chatter_id) VALUES (?,?)`,
									  [quote, chatter_id]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

/*
Adds a new record to the chatters table.
Returns true if the INSERT query was successful.
Returns false if a database error occurred during the INSERT query, and logs an error message 
	to the console if the error was anything but a duplicate entry error
*/
module.exports.addChatter = async function(name) {
	try {
		const result = await conn.query(`INSERT INTO chatters (name) VALUES (?)`, [name]);
	} catch(err) {
		if(err.code != "ER_DUP_ENTRY") {
			console.error("An error occurred while querying the DB: " + err);
		}
		return false;
	}
	return true;
}

/*
Returns the id of the given chatter based on the chatter's name
*/
module.exports.getChatterID = async function(name) {
	try {
		const result = await conn.query("SELECT id from chatters WHERE name = ?", [name]);
		if(result[0].id != null ) {
			return result[0].id;
		}
		else {
			return -1;
		}
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}