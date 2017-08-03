
module.exports = function(app, opts)
{
	return new Component(app, opts);
};

class Component
{
	constructor(app, opts)
	{
		this.opts = opts || {};
		app.set('conditions', this.opts);
		this.name = '__scale__';
	}

}