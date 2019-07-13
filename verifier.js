module.exports.isMod = function(userContext) {
	return(userContext.mod);
}

module.exports.isBroadcaster = function(userContext) {
	return(userHasBadge(userContext,"broadcaster"));
}

function userHasBadge(userContext, badgeName) {
	for(var b in userContext.badges) {
		if(b == badgeName) return true;
	}
	return false;
}