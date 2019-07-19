const verifier = require('./verifier');
const Level = require('./level');
var db;

const levelCodeRegex = new RegExp('^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$');
const invalidLettersRegex = new RegExp('[iIoOzZ]');

var queueIsOpen = false;
var currentLevel = null;

module.exports.connect = async function(db_name) {
	db = require(`./${db_name}`);
}

module.exports.executeCommand = async function(target, context, words) {

	if(words[0].toLowerCase() === "!add") {
		if(queueIsOpen) {
			//var levelCodeRegexCombined = new RegExp('^[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}$');
			var formatCorrect = levelCodeRegex.test(words[1]);
			var invalidLetter = invalidLettersRegex.test(words[1]);

			//check format, return message if invalid
			if(!formatCorrect) return "Level code format invalid";
			if(invalidLetter) return "Level codes cannot contain the letters i, o, or z";
			
			//if level code already exists, return message
			if(await codeExists(words[1])) {
				return `${words[1]} was already submitted.`;
			} 
			if(await numSubmittedBy(context.username,1) > 0) {
				return `${context.username} , you already have a level in the queue!`;
			}
			
			//add submitter (if necessary) then add level
			await addSubmitter(context.username);
			await addLevel(words[1], context.username);
			
			//Implement when bookmarks site available: check whether level creator exists, and add to DB if it doesn't
			return `Level ${words[1]} has been submitted by ${context.username} !`;
		} else { //Level queue is not open
			return "The queue is currently closed";
		}
	}

	if(words[0].toLowerCase() === "!replace") {
		var formatCorrect = levelCodeRegex.test(words[1]);
		var invalidLetter = invalidLettersRegex.test(words[1]);

		//check format, return message if invalid
		if(!formatCorrect) return "Level code format invalid";
		if(invalidLetter) return "Level codes cannot contain the letters i, o, or z";

		var result = await levelSubmittedBy(context.username);
		var oldCode;

		if(result == null) return `You have nothing in the queue to replace!`;
		
		oldCode = result.code;
		if(oldCode == words[1])	return `Level ${words[1]} is already in the queue!`;

		result = await replaceLevel(result.code, words[1]);
		if(result.affectedRows > 0)	return `Level ${oldCode} has been replaced by level ${words[1]} !`;

		console.error(`Error replacing level in queue`);
	}

	if(words[0].toLowerCase() === "!open" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		 if(!queueIsOpen) {
		 	queueIsOpen = true;
		 	return "The level queue has been opened";
		 }
	}

	if(words[0].toLowerCase() === "!close" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(queueIsOpen) {
			queueIsOpen = false;
			return "The level queue has been closed";
		}
	}

	if(words[0].toLowerCase() === "!position") {
		result = await activeQueuePosition(context.username);
		if(result == null) {
			return `${context.username} currently has no level in the queue`;
		}
		return `${result.name} is in position ${result.position} with level ${result.code}`;
	}

	if(words[0].toLowerCase() === "!next" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) {
			return `Resolve the current level (${currentLevel.code}) first!`;
		}
		var output = await nextLevel(1);
		if(output == null) {
			return `No more levels in queue!`;
		}
		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	if(words[0].toLowerCase() === "!challenge" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) {
			return `Resolve the current level ${currentLevel.code} first!`;
		}
		var output = await nextLevel(3);
		if(output == null) {
			return `No saved levels!`;
		}
		currentLevel = new Level(output);
		return `Now challenging ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	if(words[0].toLowerCase() === "!random" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) {
			return `Resolve the current level (${curentLevel.code} first!`;
		}
		var output = await randomLevel();
		if(output == null) {
			return `No more levels in queue!`;
		}
		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	if(words[0].toLowerCase() === "!completed" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) {
			return `No current level selected!`;
		}
		if(await reclassLevel(currentLevel.id, 4)) {
			var output = `Level ${currentLevel.code} completed!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!completed command did not execute successfully");
		}
	}

	if(words[0].toLowerCase() === "!skip" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) {
			return `No current level selected!`;
		}
		if(await reclassLevel(currentLevel.id, 2)) {
			var output = `Level ${currentLevel.code} skipped!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!skip command did not execute successfully");
		}
	}

	if(words[0].toLowerCase() === "!save" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) {
			return `No current level selected!`;
		}
		if(await reclassLevel(currentLevel.id, 3)) {
			var output = `Level ${currentLevel.code} saved!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!save command did not execute successfully");
		}
	}

	if(words[0].toLowerCase() === "!meme" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) {
			return `No current level selected!`;
		}
		if(await reclassLevel(currentLevel.id, 5)) {
			var output = `Level ${currentLevel.code} memed!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!meme command did not execute successfully");
		}
	}
}

async function codeExists(code) {
	var rtnval = false;
	try {
		const result = await db.query("SELECT count(*) as total from levels WHERE code = ?",
									  [code]);
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

/*
Adds a new record to the submitters table.
Returns true if the INSERT query was successful.
Returns false if a database error occurred during the INSERT query, and logs an error message 
	to the console if the error was anything but a duplicate entry error
*/
async function addSubmitter(submitter) {
	try {
		const result = await db.query(`INSERT INTO submitters (name) VALUES (?)`, [submitter]);
	} catch(err) {
		if(err.code != "ER_DUP_ENTRY") {
			console.error("An error occurred while querying the DB: " + err);
		}
		return false;
	}
	return true;
}

async function addLevel(code, submitter) {
	var submitter_id = await getSubmitterID(submitter);
	try {
		//implement more rows into insert when bookmarks site available
		const result = await db.query(`INSERT INTO levels (code,submitter_id,creator_id,queue_type) VALUES (?,?,1,1)`,
									  [code, submitter_id]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function removeLevel(code) {
	try {
		//implement more rows into insert when bookmarks site available
		const result = await db.query(`DELETE FROM levels WHERE code = ?`,
									  [code]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function replaceLevel(oldCode, newCode) {
	try {
		//implement more rows into insert when bookmarks site available
		const result = await db.query(`UPDATE levels SET code = ?, creator_id = 1 WHERE code = ?`,
									  [newCode, oldCode]);
		return result;
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
		else {
			return -1;
		}
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function numSubmittedBy(submitter, queueType) {
	try {
		const result = await db.query(`SELECT 
											COUNT(submitter_id) AS count
									   FROM 
									    	levels 
									   INNER JOIN 
									   		submitters 
									   ON
									   		levels.submitter_id = submitters.id 
									   WHERE 
									   		submitters.name = ? AND
									    	levels.queue_type = ?`,
									   [submitter, queueType]);
		return result[0].count;
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function levelSubmittedBy(submitter) {
	try {
		const result = await db.query(`SELECT 
											code
									   FROM 
									    	levels
									   INNER JOIN 
									   		submitters
									   ON
									   		levels.submitter_id = submitters.id
									   WHERE 
									   		submitters.name = ? AND
									    	levels.queue_type = 1`,
									   [submitter]);
		return result[0];
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function activeQueuePosition(submitter) {
	try {
		var result = await db.query(`
			WITH activeQueue AS
				(SELECT 
					ROW_NUMBER() OVER (ORDER BY timestamp ASC, id ASC) position,
					code,
					submitter_id,
					timestamp
				FROM
					levels
				WHERE
					queue_type = 1)
			SELECT
				activeQueue.position,
				activeQueue.code,
				submitters.name
			FROM
				activeQueue,
				submitters
			WHERE
				activeQueue.submitter_id = submitters.id AND
				submitters.name = ?`,
			[submitter]);
		return result[0];
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function nextLevel(queueType) {
	try {
		var result = await db.query(`
			WITH activeQueue AS
				(SELECT 
					ROW_NUMBER() OVER (ORDER BY timestamp ASC, id ASC) position,
					id,
					code,
					submitter_id,
					timestamp
				FROM
					levels
				WHERE
					queue_type = ?)
			SELECT
				activeQueue.id,
				activeQueue.code,
				submitters.name as submitter
			FROM
				activeQueue,
				submitters
			WHERE
				activeQueue.submitter_id = submitters.id AND
				activeQueue.position = 1`,
				[queueType]);
		return result[0];
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function randomLevel() {
	try {
		var result = await db.query(`
			SELECT
				COUNT(*) AS count 
			FROM
				levels
			WHERE
				queue_type = 1`);
		var count = result[0].count;
		console.log("count value: " + count);
		var random = Math.floor(Math.random() * count + 1);
		console.log("random value chosen: " + random);
		result = await db.query(`
			WITH activeQueue AS
				(SELECT 
					ROW_NUMBER() OVER () position,
					id,
					code,
					submitter_id
				FROM
					levels
				WHERE
					queue_type = 1)
			SELECT
				activeQueue.id,
				activeQueue.code,
				submitters.name as submitter
			FROM
				activeQueue,
				submitters
			WHERE
				activeQueue.submitter_id = submitters.id AND
				activeQueue.position = ?`,
			[random]);
		return result[0];
	} catch(err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function reclassLevel(id, queueType) {
	try {
		const result = await db.query(`UPDATE levels SET queue_type = ? WHERE id = ?`, [queueType,id]);
		return result.affectedRows == 1
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}