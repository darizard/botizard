const superUsers = [
	"nexus15",
	"mega_scott"
]

module.exports.isBroadcaster = function(userContext) {
	return(userHasBadge(userContext,"broadcaster"));
}

module.exports.isMod = function(userContext) {
	return(userContext.mod);
	if(isBroadcaster(userContext)) return true;
	if(isSuperUser(userContext)) return true;
}

module.exports.isVIP = function(userContext) {
	return(userHasBadge(userContext,"vip"));
}

module.exports.isSub = function(userContext) {
	return(userHasBadge(userContext,"subscriber"));
}

function isSuperUser(userContext) {
	for(const u of superUsers) {
		if(userContext.username == u) return true;
	}
	return false;
}

function userHasBadge(userContext, badgeName) {
	for(var b in userContext.badges) {
		if(b == badgeName) return true;
	}
	return false;
}