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

// Connect to Twitch and MySQL:
client.connect();
//queue.connect("viewerlevels");
chat.connect("chat");

var discordInitialInterval = 15 * 60 * 1000;
var discordInterval = 45 * 60 * 1000; //45 (min) * 60 (sec) * 1000 (ms)
setTimeout(pingDiscord, discordInitialInterval);

async function onMessageHandler (target, context, msg, self) {
	if(self) { return } // Ignore messages from the bot
	
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
	//		case "queue":
	//			output = await queue.executeCommand(target, context, words);
	//			break;
	//		case "mod":
	//			output = mod.executeCommand(target, context, words, client);
	//			break;
		}
	} else { //scan and deal with message accordingly
		output = await chat.scanMessage(target, context, words, client);
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

async function pingDiscord() {
	client.say("#darizard","Discord: https://discord.gg/qW2aafm");
	setTimeout(pingDiscord, discordInterval);
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