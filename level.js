var Level = class Level {
	constructor(code, submitter, creator, clearRate, difficulty, tag1, tag2, description, queueType) {
		this.code = code;
		this.submitter = submitter;
		this.creator = creator;
		this.clearRate = clearRate;
		this.difficulty = difficulty;
		this.tag1 = tag1;
		this.tag2 = tag2;
		this.description = description;
		this.queueType = queueType;
	}
}

module.exports = Level;