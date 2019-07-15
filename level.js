var Level = class Level {
	constructor(queryResult) {
		this.id = queryResult.id;
		this.code = queryResult.code;
		this.submitter = queryResult.submitter;
	}
}

module.exports = Level;