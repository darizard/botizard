var db = require('./db');

module.exports.connect = async function(db_name) {
	conn = await db.connect(db_name);
}

/*
Takes a level code passed as a string parameter to 
	check whether it has been submitted at any time
Returns TRUE if level code exists in the database
Otherwise, returns FALSE
*/
module.exports.codeExists = async function(code) {
	code = code.toUpperCase();
	try {
		const result = await conn.query("SELECT count(*) as total from levels WHERE code = ?",
									  [code]);
		return(result[0].total > 0)
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

module.exports.creatorExists = async function(creator) {
	//not implemented until Nintendo creates an SMM2 bookmarks site
}

/*
Adds a new record to the submitters table.
Returns true if the INSERT query was successful.
Returns false if a database error occurred during the INSERT query, and logs an error message 
	to the console if the error was anything but a duplicate entry error
*/
module.exports.addSubmitter = async function(submitter) {
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
module.exports.addLevel = async function(code, submitter) {
	var submitter_id = await this.getSubmitterID(submitter);
	code = code.toUpperCase();
	try {
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`INSERT INTO levels (code,submitter_id,creator_id,queue_type) VALUES (?,?,1,1)`,
									  [code, submitter_id]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

/*
Removes a record from the levels table based on its code.
*/
module.exports.removeLevel = async function(code) {
	code = code.toUpperCase();
	try {
		//implement more rows into insert when bookmarks site available
		const result = await conn.query(`DELETE FROM levels WHERE code = ?`,
									  [code]);
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}

/*
Changes a level code in the levels table.
*/
module.exports.replaceLevel = async function(oldCode, newCode) {
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

module.exports.getSubmitterID = async function(submitter) {
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

module.exports.numSubmittedBy = async function(submitter, queueType) {
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

module.exports.levelSubmittedBy = async function(submitter) {
	try {
		const result = await conn.query(`SELECT 
											code,
											queue_type
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

module.exports.activeQueuePosition = async function(submitter) {
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

module.exports.nextLevel = async function(queueType) {
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

module.exports.randomLevel = async function() {
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

module.exports.reclassLevel = async function(id, queueType) {
	try {
		const result = await conn.query(`UPDATE levels SET queue_type = ? WHERE id = ?`, [queueType,id]);
		return result.affectedRows == 1
	} catch (err) {
		console.error("An error occurred while querying the DB: " + err);
	}
}