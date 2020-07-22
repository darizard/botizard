const verifier = require('./verifier');
const bl = require('./blacklist');

module.exports.connect = async function(db_name) {
	cq.connect(db_name);
}

module.exports.executeCommand = async function(target, context, words, client) {
	if(words[0].toLowerCase() === "!pls"){
		return "RareChar RareChar RareChar RareChar RareChar";
	}

	/*else if(words[0].toLowerCase() === "!multi"){
		return "Multitwitch link: multitwitch.tv/darizard/mindfirepsion";
	}*/
}

module.exports.scanMessage = async function(target, context, words, client) {
	output = null;
	if(!verifier.isBroadcaster(context)) {
		output = bl.moderate(target,context,words,client);
	}

	return output;
}

function arrayToString(array, start, end) {
	var output = "";
	for(var i = start; i < end; i++) {
		output += array[i];
		output += ' ';
	}
	return output.substring(0,output.length - 1);
}