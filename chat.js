const verifier = require('./verifier');
var db = require('./db');
var conn;

module.exports.connect = async function(db_name) {
	conn = await db.connect(db_name);
}

module.exports.executeCommand = async function(target, context, words, client) {
	if(words[0].toLowerCase() === "!pls"){
		return "RareChar RareChar RareChar RareChar RareChar";
	}

	if(words[0].toLowerCase() === "!discord"){
		return "Why not join our Discord? https://discord.gg/qW2aafm";
	}

	if(words[0].toLowerCase() === "!so") {
		if(words[1].charAt(0) === '@') {
			words[1] = words[1].substring(1, words[1].length);
		}
		if(words[1].toLowerCase() === context.username) {
			client.timeout(target, context.username, 600, "self-shoutout");
			return "well that's just poor taste --> [timeout]";
		}
		else
			return "Shoutout to " + words[1] + "! Please check them out and give them a follow at https://www.twitch.tv/" + words[1];
	}

	if(words[0].toLowerCase() === "!quote") {
		if(words[1].toLowerCase() === "add") {
			if(words.length > 2) {
				var quote = arrayToString(words, 2, words.length);
				console.log("quote built: " + quote);
				await addChatter(context.username);
				quote = trimQuotes(quote);
				await addQuote(quote, context.username);
			}
		}
	}
}

function arrayToString(array, start, end) {
	var output = "";
	for(var i = start; i < end; i++) {
		output += array[i];
		output += ' ';
	}
	return output.substring(0,output.length - 1);
}

function trimQuotes(quoteString) {
	const quoteInputRegex = new RegExp('[\\d\\w].+[\\d\\w]');
	return quoteString.match(quoteInputRegex);
}

async function addQuote(quote, chatter) {
	try {
		var chatter_id = await getChatterID(chatter);
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
async function addChatter(name) {
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

async function getChatterID(name) {
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