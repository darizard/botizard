module.exports.executeCommand = function(target, context, words){
	if(words[0].toLowerCase() === "!test") {
		console.log("This is a test.");
	}

	if(words[0].toLowerCase() === "!me") {
		console.log("target: " + target);
		console.log("context: " + JSON.stringify(context));
		console.log("words: " + words);
	}

	if(words[0].toLowerCase() === "!badges") {
		printAllBadges(context);
	}

	function printAllBadges(context) {
		for(var b in context.badges) {
			console.log(b);
		}
	}
}
