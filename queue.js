const verifier = require('./verifier');
const Level = require('./level');
var db = require('./db');
var conn;

const levelCodeRegex = new RegExp('^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$');
const invalidLettersRegex = new RegExp('[iIoOzZ]');

var queueIsOpen = false;
var currentLevel = null;

module.exports.connect = async function(db_name) {
	conn = await db.connect(db_name);
}

module.exports.executeCommand = async function(target, context, words) {

	//User is submitting a level to the queue
	//Usage: !add <code>
	if(words[0].toLowerCase() === "!add") {
		if(queueIsOpen) {
			//var levelCodeRegexCombined = new RegExp('^[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}$');
			var formatCorrect = levelCodeRegex.test(words[1]);
			var invalidLetter = invalidLettersRegex.test(words[1]);

			//check format, return message if invalid
			if(!formatCorrect) return "Level code format invalid";
			if(invalidLetter) return "Level codes cannot contain the letters i, o, or z";
			
			//if level code already exists, return message
			if(await codeExists(words[1])) 
				return `${words[1]} was already submitted.`;

			if(await numSubmittedBy(context.username,1) > 0)
				return `${context.username} , you already have a level in the queue!`;
			
			//add submitter (if necessary) then add level
			await addSubmitter(context.username);
			await addLevel(words[1], context.username);
			
			//Implement when bookmarks site available: check whether level creator exists, and add to DB if it doesn't
			return `Level ${words[1]} has been submitted by ${context.username} !`;
		} else { //Level queue is not open
			return "The queue is currently closed";
		}
	}

	//User is replacing an old code in the active queue that they submitted with a new one
	//Usage: !replace <code> where code is the new level code
	if(words[0].toLowerCase() === "!replace") {
		var formatCorrect = levelCodeRegex.test(words[1]);
		var invalidLetter = invalidLettersRegex.test(words[1]);

		//check format, return message if invalid
		if(!formatCorrect) return "Level code format invalid";
		if(invalidLetter) return "Level codes cannot contain the letters i, o, or z";

		//ensure viewer has a level in queue
		var result = await levelSubmittedBy(context.username);
		if(result == null) return `You have nothing in the queue to replace!`;
		
		//ensure viewer is submitting a different level
		var oldCode = result.code;
		if(oldCode == words[1])	return `Level ${words[1]} is already in the queue!`;

		//replace level in queue
		result = await replaceLevel(result.code, words[1]);
		if(result.affectedRows > 0)	return `Level ${oldCode} has been replaced by level ${words[1]} !`;

		console.error(`Error replacing level in queue`);
	}

	//Open the level queue [mod only command]
	//Usage: !open
	if(words[0].toLowerCase() === "!open" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		 if(!queueIsOpen) {
		 	queueIsOpen = true;
		 	return "The level queue has been opened";
		 }
	}

	//Close the level queue [mod only command]
	//Usage: !close
	if(words[0].toLowerCase() === "!close" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(queueIsOpen) {
			queueIsOpen = false;
			return "The level queue has been closed";
		}
	}

	//User is asking for their own position in the queue
	//Usage: !position
	if(words[0].toLowerCase() === "!position") {
		result = await activeQueuePosition(context.username);
		if(result == null) {
			return `${context.username} currently has no level in the queue`;
		}
		return `${result.name} is in position ${result.position} with level ${result.code}`;
	}

	//Move to the next level in the queue [mod only command]
	//Usage: !next
	if(words[0].toLowerCase() === "!next" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) return `Resolve the current level (${currentLevel.code}) first!`;
	
		var output = await nextLevel(1);
		if(output == null) return `No more levels in queue!`;

		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Challenge a previously saved level [mod only command]
	//Usage: !challenge
	if(words[0].toLowerCase() === "!challenge" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) return `Resolve the current level ${currentLevel.code} first!`;

		var output = await nextLevel(3);
		if(output == null) return `No saved levels!`;

		currentLevel = new Level(output);
		return `Now challenging ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Move to a random level in the queue [mod only command]
	//Usage: !random
	if(words[0].toLowerCase() === "!random" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) return `Resolve the current level (${curentLevel.code} first!`;

		var output = await randomLevel();
		if(output == null) return `No more levels in queue!`;

		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Mark the current level as completed [mod only command]
	//Usage: !completed
	if(words[0].toLowerCase() === "!completed" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) return `No current level selected!`;

		if(await reclassLevel(currentLevel.id, 4)) {
			var output = `Level ${currentLevel.code} completed!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!completed command did not execute successfully");
		}
	}

	//Skip (choose not to play) the current level [mod only command]
	//Usage: !skip
	if(words[0].toLowerCase() === "!skip" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) return `No current level selected!`;

		if(await reclassLevel(currentLevel.id, 2)) {
			var output = `Level ${currentLevel.code} skipped!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!skip command did not execute successfully");
		}
	}

	//Save the current level for a future play [mod only command]
	//Usage: !save
	if(words[0].toLowerCase() === "!save" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) return `No current level selected!`;

		if(await reclassLevel(currentLevel.id, 3)) {
			var output = `Level ${currentLevel.code} saved!`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!save command did not execute successfully");
		}
	}

	//Enshrine the current level code as a meme, to be cherished for all time
	//Usage: !meme
	if(words[0].toLowerCase() === "!meme" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) return `No current level selected!`;

		if(await reclassLevel(currentLevel.id, 5)) {
			var output = `${currentLevel.code} has been enshrined as a meme. Congratulations, ${context.username}, you did it.`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!meme command did not execute successfully");
		}
	}
}

/*
Takes a level code passed as a string parameter to 
	check whether it has been submitted at any time
Returns TRUE if level code exists in the database
Otherwise, returns FALSE
*/
async function codeExists(code) {
	code = code.toUpperCase();
	try {
		const result = await conn.query("SELECT count(*) as total from levels WHERE code = ?",
									  [code]);
		return(result[0].total > 0)
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function creatorExists(creator) {
	//not implemented until Nintendo creates an SMM2 bookmarks site
}

/*
Adds a new record to the submitters table.
Returns true if the INSERT query was successful.
Returns false if a database error occurred during the INSERT query, and logs an error message 
	to the console if the error was anything but a duplicate entry error
*/
async function addSubmitter(submitter) {
	try {
		const result = await conn.query(`INSERT INTO submitters (name) VALUES (?)`, [submitter]);
	} catch(err) {
		if(err.code != "ER_DUP_ENTRY") {
			console.error("An error occurred while querying the DB: " + err);
		}
		return false;
	}
	return true;
}

/*
Adds a new record to the levels table. 
*/
async function addLevel(code, submitter) {
	var submitter_id = await getSubmitterID(submitter);
	code = code.toUpperCase();
	try {
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`INSERT INTO levels (code,submitter_id,creator_id,queue_type) VALUES (?,?,1,1)`,
									  [code, submitter_id]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function removeLevel(code) {
	code = code.toUpperCase();
	try {
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`DELETE FROM levels WHERE code = ?`,
									  [code]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function replaceLevel(oldCode, newCode) {
	oldCode = oldCode.toUpperCase();
	newCode = newCode.toUpperCase();
	try {
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`UPDATE levels SET code = ?, creator_id = 1 WHERE code = ?`,
									  [newCode, oldCode]);
		return result;
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

async function getSubmitterID(submitter) {
	try {
		const result = await conn.query("SELECT id from submitters WHERE name = ?", [submitter]);
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
		const result = await conn.query(`SELECT 
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
		const result = await conn.query(`SELECT 
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
		var result = await conn.query(`
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
		var result = await conn.query(`
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
		var result = await conn.query(`
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
		result = await conn.query(`
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
		const result = await conn.query(`UPDATE levels SET queue_type = ? WHERE id = ?`, [queueType,id]);
		return result.affectedRows == 1
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}