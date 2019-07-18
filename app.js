//twitch API libray
const twitch = require('tmi.js');

//chatbot modules
var liaison = require('./liaison');
var chat = require('./chat');
var queue = require('./queue');
var info = require('./info');

//json credentials file for connecting to twitch
const twitchcreds = require('./resources/twitchcreds.json');

let client = new twitch.client(twitchcreds);

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('disconnected', onDisconnectedHandler);

// Connect to Twitch:
client.connect();
queue.connect("db");

async function onMessageHandler (target, context, msg, self){
	if(self) { return } // Ignore messages from the bot
	if(msg[0] != "!") { return } // Ignore messages not beginning with '!'

	var words = msg.split(/[ ,]+/);
	var output = "";

	switch(liaison.findModule(words[0])) {
		case "chat":
			output = chat.executeCommand(target, context, words, client);
			break;
		case "queue":
			output = await queue.executeCommand(target, context, words);
			break;
		case "info":
			output = info.executeCommand(target, context, words);
			break;
	}

	if(output) sendMessage(target, context, output);
}

//Helper function sends messages
function sendMessage (target, context, message) {
	if(context['message-type'] === 'whisper') {
		client.whisper(target, message)
	} else {
		client.say(target, message)
	}
}

//When connecting to Twitch chat:
function onConnectedHandler (addr, port) {
	console.log(`* Connected to ${addr}:${port}`)
}

//When disconnecting from Twitch:
function onDisconnectedHandler (reason) {
	console.log(`Disconnected: ${reason}`)
	process.exit(1)
}