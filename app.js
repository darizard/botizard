//twitch API libray
const twitch = require('tmi.js');

//botizard credentials file
const twitchcreds = require('./resources/twitchcreds.json');

//establish twitch client
var client = new twitch.client(twitchcreds);

//chatbot modules
var liaison = require('./liaison');
var chat = require('./chat');
var info = require('./info');

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('disconnected', onDisconnectedHandler);

//connect to Twitch [and MySQL]:
client.connect();
//chat.connect("chat");

var discordInitialInterval = 15 * 60 * 1000;
var discordInterval = 45 * 60 * 1000; //45 (min) * 60 (sec) * 1000 (ms)
setTimeout(pingDiscord, discordInitialInterval);

async function onMessageHandler (target, context, msg, self) {
	if(self) { return } //Ignore messages from the bot
	
	var words = msg.split(/[ ,]+/);
	var output = "";

	if(msg[0] == "!") { //run appropriate command
		switch(liaison.findModule(words[0])) {
			case "chat":
				output = await chat.executeCommand(target, context, words, client);
				break;
			case "info":
				output = await info.executeCommand(target, context, words);
				break;
			//case "mod":
			//	output = await mod.executeCommand(target, context, words, client);
			//	break;
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