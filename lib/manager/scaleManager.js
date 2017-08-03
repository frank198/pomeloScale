const path = require('path');
const Operator = require('./operator');
const logger = require('pomelo-logger').getLogger('pomelo-scale-plugin', __filename);

class ScaleManager
{
	constructor(app, conditions)
    {
		this.app = app;
		conditions = conditions || {};
		this.cpuConditions = conditions.cpu;
		this.memoryConditions = conditions.memory;
		this.backup = conditions.backup;
		if (!this.backup)
        {
			throw new Error('no backup servers is available.');
		}
		this.init();

		this.backup = path.join(this.app.getBase(), this.backup);
		this.availableServers = require(this.backup);
	}

	start()
    {
		if (this.cpuConditions)
        {
			const cpuOperator = new Operator(this, this.app, this.cpuConditions, 'cpu');
			cpuOperator.start();
		}
		if (this.memoryConditions)
        {
			const memoryOperator = new Operator(this, this.app, this.memoryConditions, 'memory');
			memoryOperator.start();
		}
	}

	getAvailableServers(type, number)
    {
		const availables = this.availableServers[type];
		if (number > availables.length)
        {
			logger.error('not enough servers to scale up.');
			return null;
		}
		const servers = availables.slice(0, number);
		availables.splice(0, number);
		return servers;
	}
}

module.exports = ScaleManager;