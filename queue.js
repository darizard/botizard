var db = require('./db');
const verifier = require('./verifier');
const Level = require('./level');

const levelCodeRegex = new RegExp('^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$');
const invalidLettersRegex = new RegExp('[iIoOzZ]');

var isOpen = false;

module.exports.executeCommand = async function(target, context, words) {

	if(words[0].toLowerCase() === "!add") {
		if(isOpen) {
			//var levelCodeRegexCombined = new RegExp('^[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}$');
			var formatCorrect = levelCodeRegex.test(words[1]);
			var invalidLetter = invalidLettersRegex.test(words[1]);

			//check format, return message if invalid
			if(!formatCorrect) return "Level code format invalid";
			if(invalidLetter) return "Level codes cannot contain the letters i, o, or z";
			
			//if level code already exists, return message
			if(await codeExists(words[1])) {
				return `${words[1]} was already submitted.`;	
			} else {
				//add submitter if necessary, then add level
				if(!await submitterExists(context.username)) {
					await addSubmitter(context.username);
				}
				await addLevel(words[1], context.username);
			}
			//Implement when bookmarks site available: check whether level creator exists, and add to DB if it doesn't
			return `Level ${words[1]} has been submitted by ${context.username} !`;
		} else { //Level queue is not open
			return "The queue is currently closed";
		}
	}

	if(words[0].toLowerCase() === "!open" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		 if(!isOpen) {
		 	isOpen = true;
		 	return "The level queue has been opened";
		 }
	}

	if(words[0].toLowerCase() === "!close" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(isOpen) {
			isOpen = false;
			return "The level queue has been closed";
		}
	}
}

async function codeExists(code) {
	var rtnval = false;
	try {
		const result = await db.query("SELECT count(*) as total from levels WHERE code = ?", [code]);
		if(result[0].total > 0) {
			rtnval = true;
		}
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
	return rtnval;
}

async function creatorExists(creator) {
	//not implemented until Nintendo creates an SMM2 bookmarks site
}

async function submitterExists(submitter) {
	var rtnval = false;
	try {
		const result = await db.query("SELECT count(*) as total from submitters WHERE name = ?", [submitter]);
		if(result[0].total > 0) {
			rtnval = true;
		}
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
	return rtnval;
}

async function addSubmitter(submitter) {
	try {
		const result = await db.query(`INSERT INTO submitters (name) VALUES ("${submitter}")`);
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function addLevel(code, submitter) {
	var submitter_id = await getSubmitterID(submitter);
	try {
		//implement more rows into insert when bookmarks site available
		const result = await db.query(`INSERT INTO levels (code,submitter_id,creator_id,queue_type) VALUES ("${code}",${submitter_id},1,1)`);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function getSubmitterID(submitter) {
	try {
		const result = await db.query("SELECT id from submitters WHERE name = ?", [submitter]);
		if(result[0].id != null ) {
			return result[0].id;
		}
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}