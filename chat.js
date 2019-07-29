const verifier = require('./verifier');
const cq = require('./chatqueries');

module.exports.connect = async function(db_name) {
	cq.connect(db_name);
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
				await cq.addChatter(context.username);
				quote = trimQuote(quote);
				await cq.addQuote(quote, context.username);
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
	const quoteInputRegex = new RegExp('[\\d\\w].+[\\d\\w]');
	return quoteString.match(quoteInputRegex);
}