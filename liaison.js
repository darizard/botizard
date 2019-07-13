const modules = {
	CHAT: 'chat',
	QUEUE: 'queue',
	INFO: 'info'
}

const commands = {
	pls:modules.CHAT,
	discord:modules.CHAT,
	so:modules.CHAT,

	add:modules.QUEUE,
	open:modules.QUEUE,
	close:modules.QUEUE,

	test:modules.INFO,
	me:modules.INFO,
	badges:modules.INFO
}

module.exports.findModule = function(cmd) {
	return commands[cmd.substring(1,cmd.length)];
}