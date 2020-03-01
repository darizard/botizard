const superUsers = [
	"NeXuS15"
]

module.exports.isSuperUser = function(userContext) {
	for(const u of superUsers) {
		if(userContext.username == u) return true;
	}
	return false;
}

module.exports.isMod = function(userContext) {
	return(userContext.mod);
}

module.exports.isBroadcaster = function(userContext) {
	return(userHasBadge(userContext,"broadcaster"));
}

module.exports.isVIP = function(userContext) {
	return(userHasBadge(userContext,"vip"));
}

module.exports.isSub = function(userContext) {
	return(userHasBadge(userContext,"subscriber"));
}

function userHasBadge(userContext, badgeName) {
	for(var b in userContext.badges) {
		if(b == badgeName) return true;
	}
	return false;
}