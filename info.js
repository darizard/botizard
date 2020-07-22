module.exports.executeCommand = async function(target, context, words){
	if(words[0].toLowerCase() === "!test") {
		console.log("This is a test.");
	}

	else if(words[0].toLowerCase() === "!me") {
		console.log("target: " + target);
		console.log("context: " + JSON.stringify(context));
		console.log("words: " + words);
	}

	else if(words[0].toLowerCase() === "!badges") {
		printAllBadges(context);
	}

	else if(words[0].toLowerCase() === "!discord"){
		return "Discord: https://discord.gg/qW2aafm";
	}

	function printAllBadges(context) {
		for(var b in context.badges) {
			console.log(b);
		}
	}
}
