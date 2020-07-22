const verifier = require('./verifier');

module.exports.executeCommand = async function(target, context, words, client) {
	if(!(verifier.isMod(context))) return null;

	if(words[0].toLowerCase() === "!title"){
		return "RareChar RareChar RareChar Rarehar RareChar";
	}

	else if(words[0].toLowerCase() === "!game"){
		return "Discord: https://discord.gg/qW2aafm";
	}
}