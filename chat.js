module.exports.executeCommand = function(target, context, words, client) {
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
};