const ScaleManager = require('../manager/scaleManager');

class Event
{
	constructor(app)
	{
		this.app = app;
	}
}

Event.prototype.start_all = function()
{
	const conditions = this.app.get('conditions');
	const scaleManager = new ScaleManager(this.app, conditions);
	scaleManager.start();
	this.app.set('__scaleManager__', scaleManager);
};

module.exports = function(app)
{
	if (!(this instanceof Event))
		return new Event(app);
};
