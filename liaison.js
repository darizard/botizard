const modules = {
	CHAT: 'chat',
	QUEUE: 'queue',
	INFO: 'info'
}

const commands = {
	pls:modules.CHAT,
	discord:modules.CHAT,
	so:modules.CHAT,
	quote:modules.CHAT,

	add:modules.QUEUE,
	open:modules.QUEUE,
	close:modules.QUEUE,
	position:modules.QUEUE,
	next:modules.QUEUE,
	random:modules.QUEUE,
	completed:modules.QUEUE,
	skip:modules.QUEUE,
	save:modules.QUEUE,
	meme:modules.QUEUE,
	invalid:modules.QUEUE,
	replace:modules.QUEUE,
	challenge:modules.QUEUE,

	test:modules.INFO,
	me:modules.INFO,
	badges:modules.INFO
}

module.exports.findModule = function(cmd) {
	return commands[cmd.substring(1,cmd.length)];
}