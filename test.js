//twitch API libray
const twitch = require('tmi.js');

//chatbot modules
const queue = require('./queue');
const chat = require('./chat');
const info = require('./info');
const liaison = require('./liaison');

//json credentials file for connecting to twitch
const twitchcreds = require('./resources/twitchcreds.json');

let client = new twitch.client(twitchcreds);

client.on('connected', onConnectedHandler);
client.on('disconnected', onDisconnectedHandler);

const broadcasterContext = {"badge-info":"subscriber/2","badges":{"broadcaster":"1","subscriber":"0"},"color":"#EE8328","display-name":"Darizard","emotes":null,"flags":null,"id":"7e1fe055-79c3-4c0e-87f5-6cff2ebdc7d8","mod":false,"room-id":"123657070","subscriber":true,"tmi-sent-ts":"1562976666694","turbo":false,"user-id":"123657070","user-type":null,"emotes-raw":null,"badges-raw":"broadcaster/1,subscriber/0","username":"darizard","message-type":"chat"};
const modContext = {"badge-info":null,"badges":{"moderator":"1"},"color":"#FF0000","display-name":"darizard_test","emotes":null,"flags":null,"id":"40ed201e-d6d9-40d3-952b-562073b4aa96","mod":true,"room-id":"123657070","subscriber":false,"tmi-sent-ts":"1562976880167","turbo":false,"user-id":"433422471","user-type":"mod","emotes-raw":null,"badges-raw":"moderator/1","username":"darizard_test","message-type":"chat"};
const vipcontext = {"badge-info":null,"badges":{"vip":"1"},"color":"#FF0000","display-name":"darizard_test","emotes":null,"flags":null,"id":"82842bd9-45b2-452c-a961-303a9abf3c49","mod":false,"room-id":"123657070","subscriber":false,"tmi-sent-ts":"1562976845885","turbo":false,"user-id":"433422471","user-type":null,"emotes-raw":null,"badges-raw":"vip/1","username":"darizard_test","message-type":"chat"};

// Connect to MySQL:
queue.connect("viewerlevels_test");
chat.connect("chat_test");

runTest();

async function runTest() {
	var target = "#darizard";

	await client.connect();
	await executeCommand(target, modContext, "!quote", client);
	//await executeCommand(target, modContext, "!pls", client);
	//await executeCommand(target, modContext, "!so nexus15", client);
	//await executeCommand(target, modContext, "!replace 222-222-222", client);
	//await executeCommand(target, modContext, "!discord", client);
	//await executeCommand(target, modContext, "!add 555-555-555", client);
	
	//await executeCommand(target, modContext, "!meme", client);
	await client.disconnect();

}

async function executeCommand(target, context, msg, client) {
	var words = msg.split(/[ ,]+/);
	var output = "";

	switch(liaison.findModule(words[0])) {
		case "chat":
			output = await chat.executeCommand(target, context, words, client);
			break;
		case "queue":
			output = await queue.executeCommand(target, context, words);
			break;
		case "info":
			output = info.executeCommand(target, context, words);
			break;
	}

	if(output) console.log("Twitch Message: " + output);
}

//When connecting to Twitch chat:
function onConnectedHandler (addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

//When disconnecting from Twitch:
function onDisconnectedHandler (reason) {
	console.log(`Disconnected: ${reason}`)
	process.exit(1)
}

