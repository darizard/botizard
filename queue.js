const verifier = require('./verifier');
const Level = require('./level');
const qq = require('./queuequeries');

const levelCodeRegex = new RegExp('^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$');
const invalidLettersRegex = new RegExp('[iIoOzZ]');

var queueIsOpen = false;
var currentLevel = null;

module.exports.connect = async function(db_name) {
	qq.connect(db_name);
}

module.exports.executeCommand = async function(target, context, words) {

	//User is submitting a level to the queue
	//Usage: !add <code>
	if(words[0].toLowerCase() === "!add") {
		if(queueIsOpen) {
			//var levelCodeRegexCombined = new RegExp('^[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}-[0-9a-hj-np-yA-HJ-NP-Y]{3}$');

			//check format, return message if invalid
			if(!levelCodeRegex.test(words[1])) 
				return "Level code format invalid";
			if(invalidLettersRegex.test(words[1])) 
				return "Level codes cannot contain the letters i, o, or z";
			
			//if level code already exists, return message
			if(await qq.codeExists(words[1])) 
				return `${words[1]} was already submitted`;

			if(await qq.numSubmittedBy(context.username,1) > 0)
				return `${context.username} , you already have a level in the queue!`;
			
			//add submitter (if necessary) then add level
			await qq.addSubmitter(context.username);
			if(await qq.addLevel(words[1], context.username)) {
				return `Level ${words[1]} has been submitted by ${context.username} !`;
			} else {
				return `Error submitting level`;
			}
			//Implement when bookmarks site available: check whether level creator exists, and add to DB if it doesn't
		} else { //Level queue is not open
			return "The queue is currently closed";
		}
	}

	//User is replacing an old code in the active queue that they submitted with a new one
	//Usage: !replace <code> where code is the new level code
	if(words[0].toLowerCase() === "!replace") {
		//check format, return message if invalid
		if(!levelCodeRegex.test(words[1])) 
			return "Level code format invalid";
		if(invalidLettersRegex.test(words[1])) 
			return "Level codes cannot contain the letters i, o, or z";

		//ensure viewer has a level in queue
		var result = await qq.levelSubmittedBy(context.username);
		if(result == null)
			return `You have nothing in the queue to replace!`;

		//ensure viewer is not replacing the current level
		if(currentLevel != null && currentLevel.code.toUpperCase() == result.code.toUpperCase()) 
			return `Level ${currentLevel.code} cannot be replaced because it is currently being played`;
		
		//ensure viewer is submitting a different level
		var oldCode = result.code;
		if(oldCode == words[1])
			return `Level ${words[1]} is already in the queue!`;

		//ensure the replacement level was not already submitted in the past
		if(await qq.codeExists(words[1])) 
			return `${words[1]} was previously submitted in this channel and cannot be a replacement`;

		//replace level in queue
		if(await qq.replaceLevel(result.code, words[1]))
			return `Level ${oldCode} has been replaced by level ${words[1]} !`;

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
		result = await qq.activeQueuePosition(context.username);
		if(result == null) {
			return `${context.username} currently has no level in the queue`;
		}
		return `${result.name} is in position ${result.position} with level ${result.code}`;
	}

	//User wants to view the queue
	//Usage: !list or !queue
	if(words[0].toLowerCase() === "!queue" || words[0].toLowerCase() === "!list") {
		result = await qq.getLevels();
		if(result[0] == null) {
			return `No levels are currently in the queue!`;
		} else {
			var displayListSize = result.length < 3 ? result.length.toString() : "3";
			var output = `Currently ${result.length} level(s) in queue. The next ${displayListSize} people in queue are: `;
			for(var i = 0; i < result.length; i++) {
				output += `${result[i].submitter}, `;
			}
			return output.substring(0,output.length - 2);
		}
	}	

	//Move to the next level in the queue [mod only command]
	//Usage: !next
	if(words[0].toLowerCase() === "!next" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) 
			return `Resolve the current level (${currentLevel.code}) first!`;
	
		var output = await qq.nextLevel(1);
		if(output == null) 
			return `No more levels in queue!`;

		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Challenge a previously saved level [mod only command]
	//Usage: !challenge
	if(words[0].toLowerCase() === "!challenge" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) 
			return `Resolve the current level ${currentLevel.code} first!`;

		var output = await qq.nextLevel(3);
		if(output == null) 
			return `No saved levels!`;

		currentLevel = new Level(output);
		return `Now challenging ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Move to a random level in the queue [mod only command]
	//Usage: !random
	if(words[0].toLowerCase() === "!random" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel != null) 
			return `Resolve the current level (${curentLevel.code} first!`;

		var output = await qq.randomLevel();
		if(output == null) 
			return `No more levels in queue!`;

		currentLevel = new Level(output);
		return `The next level is ${currentLevel.code}, submitted by ${currentLevel.submitter} !`;
	}

	//Mark the current level as completed [mod only command]
	//Usage: !completed
	if(words[0].toLowerCase() === "!completed" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null) 
			return `No current level selected!`;

		if(await qq.reclassLevel(currentLevel.id, 4)) {
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
		if(currentLevel == null) 
			return `No current level selected!`;

		if(await qq.reclassLevel(currentLevel.id, 2)) {
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
		if(currentLevel == null) 
			return `No current level selected!`;

		if(await qq.reclassLevel(currentLevel.id, 3)) {
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
		if(currentLevel == null) 
			return `No current level selected!`;

		if(await qq.reclassLevel(currentLevel.id, 5)) {
			var output = `${currentLevel.code} has been enshrined as a meme. Congratulations, ${context.username} , you did it.`;
			currentLevel = null;
			return output;
		}
		else {
			console.error("!meme command did not execute successfully");
		}
	}

	/*Identify the current level an invalid level code and remove it from the database
	Usage: !invalid
	*/
	if(words[0].toLowerCase() === "!invalid" && (verifier.isMod(context) || verifier.isBroadcaster(context))) {
		if(currentLevel == null)
			return `No current level selected!`;

		if(await qq.removeLevel(currentLevel.code))
			return `Invalid level code ${currentLevel.code} has been removed from the queue`;
		
		return `Error removing invalid level`;
	}
}