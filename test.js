//twitch API libray
const twitch = require('tmi.js');

//json credentials file for connecting to twitch
const twitchcreds = require('./resources/twitchcreds.json');

//establish twitch client
var client = new twitch.client(twitchcreds);

//chatbot modules
const chat = require('./chat');
const info = require('./info');
const liaison = require('./liaison');

client.on('connected', onConnectedHandler);
client.on('disconnected', onDisconnectedHandler);

const broadcasterContext = {"badge-info":"subscriber/2","badges":{"broadcaster":"1","subscriber":"0"},"color":"#EE8328","display-name":"Darizard","emotes":null,"flags":null,"id":"7e1fe055-79c3-4c0e-87f5-6cff2ebdc7d8","mod":false,"room-id":"123657070","subscriber":true,"tmi-sent-ts":"1562976666694","turbo":false,"user-id":"123657070","user-type":null,"emotes-raw":null,"badges-raw":"broadcaster/1,subscriber/0","username":"darizard","message-type":"chat"};
const modContext = {"badge-info":null,"badges":{"moderator":"1"},"color":"#FF0000","display-name":"darizard_test","emotes":null,"flags":null,"id":"40ed201e-d6d9-40d3-952b-562073b4aa96","mod":true,"room-id":"123657070","subscriber":false,"tmi-sent-ts":"1562976880167","turbo":false,"user-id":"433422471","user-type":"mod","emotes-raw":null,"badges-raw":"moderator/1","username":"darizard_test","message-type":"chat"};
const vipContext = {"badge-info":null,"badges":{"vip":"1"},"color":"#FF0000","display-name":"darizard_test","emotes":null,"flags":null,"id":"82842bd9-45b2-452c-a961-303a9abf3c49","mod":false,"room-id":"123657070","subscriber":false,"tmi-sent-ts":"1562976845885","turbo":false,"user-id":"433422471","user-type":null,"emotes-raw":null,"badges-raw":"vip/1","username":"darizard_test","message-type":"chat"};

runTest();

async function runTest() {
	
	await client.connect();
	
	await m("!pls");
	await m("AYAYA");
	await m("!quote");
	
	await client.disconnect();
}

async function m(msg, numIter=1) {
	var target = "#darizard";
	for(var i = 0; i < numIter; i++) {
		await executeCommand(target, vipContext, msg, client);
	}
}

async function executeCommand(target, context, msg, client) {
	var words = msg.split(/[ ,]+/);
	var output = "";

	if(msg[0] == "!") { //run appropriate command
		switch(liaison.findModule(words[0])) {
		case "chat":
			output = await chat.executeCommand(target, context, words, client);
			break;
		case "info":
			output = info.executeCommand(target, context, words);
			break;
		//case "mod":
			//	output = await mod.executeCommand(target, context, words, client);
			//	break;
		}
	} else { //scan and deal with message accordingly
		output = await chat.scanMessage(target, context, words, client);
	}
	if(output) console.log("Twitch Message: " + output);
}

//When connecting to Twitch chat:
function onConnectedHandler (addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

//When disconnecting from Twitch:
function onDisconnectedHandler (reason) {
	console.log(`Disconnected: ${reason}`);
	process.exit(1)
}

