
class Component
{
	constructor(app, opts)
	{
		this.opts = opts || {};
		app.set('conditions', this.opts);
	}
}
Component.prototype.name = '__scale__';

module.exports = function(app, opts)
{
	return new Component(app, opts);
};