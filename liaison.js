const modules = {
	CHAT: 'chat',
	QUEUE: 'queue',
	INFO: 'info',
	MOD: 'mod'
}

const commands = {
	pls:modules.CHAT,
	multi:modules.CHAT,

	test:modules.INFO,
	me:modules.INFO,
	badges:modules.INFO,
	discord:modules.INFO,

	title:modules.MOD,
	game:modules.MOD
}

module.exports.findModule = function(cmd) {
	cmd = cmd.toLowerCase();
	return commands[cmd.substring(1,cmd.length)];
}