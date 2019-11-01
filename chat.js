const verifier = require('./verifier');
const cq = require('./chatqueries');

module.exports.connect = async function(db_name) {
	cq.connect(db_name);
}

module.exports.executeCommand = async function(target, context, words, client) {
	if(words[0].toLowerCase() === "!pls"){
		return "RareChar RareChar RareChar RareChar RareChar";
	}

	if(words[0].toLowerCase() === "!charity"){
		return "Charity Message";
	}

	if(words[0].toLowerCase() === "!discord"){
		return "I've got a Discord server! All are welcome. https://discord.gg/qW2aafm";
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
		if(words.length < 2) {
			result = await cq.randomQuote();
			//TODO: cq.randomQuote() returns a timestamp as part of result. Parse it and include its date in the output message.
			if(result != undefined) {
				return  `Quote #${result.rowNum}: "${result.quote}", submitted by ${result.chatter}`;
			} else {
				return `Error retrieving quote`;
			}
		}
		else if(words[1].toLowerCase() === "add" && words.length > 2) {
			var quote = arrayToString(words, 2, words.length);
			await cq.addChatter(context.username);
			quote = trimQuote(quote);
			if(await cq.addQuote(quote, context.username)) {
				return `Quote successfully added -> \"${quote}\"`;
			} else {
				return `Error adding quote`;
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

function trimQuote(quoteString) {
	const quoteInputRegex = new RegExp('[^\'\"\`].+[^\'\"\`"]');
	return quoteString.match(quoteInputRegex);
}