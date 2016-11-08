const ScaleManager = require('../manager/scaleManager');

class Event
{
	constructor(app)
    {
		this.app = app;
	}

	start_all()
    {
		const conditions = this.app.get('conditions');
		const scaleManager = new ScaleManager(this.app, conditions);
		scaleManager.start();
	}
}

module.exports = Event;
