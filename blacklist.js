const terms = require('./resources/terms.json');
const ayaya = terms["ayaya"];

module.exports.moderate = function(target,context,words,client) {
	output = null;
	for(a = 0; a < ayaya.length; a++) {
		for(w = 0; w < words.length; w++) {
			console.log(ayaya[a] + " : " + words[w]);
			if(ayaya[a] == words[w]) {
				client.timeout(target, context.username, 20, "ayaya'd");
				output = "NO AYAYAs DansGame -> 20 second timeout";
				return output;
			}
		}
	}
	return output;
}