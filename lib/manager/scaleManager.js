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
		this.otherConditions = conditions.other;
		if (!this.backup)
		{
			throw new Error('no backup servers is available.');
		}

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

		if (this.otherConditions)
		{
			let otherOperator = null;
			if (this.otherConditions.hasOwnProperty('otherClass'))
			{
				const otherClass = this.otherConditions.otherClass;
				delete this.otherConditions.otherClass;
				otherOperator = new otherClass(this, this.app, this.otherConditions, require('../util/starter').Run);

			}
			else
			{
				otherOperator = new Operator(this, this.app, this.otherConditions, 'other');
			}
			otherOperator.start();
		}
	}

	getAvailableServers(type, number)
	{
		const availables = this.availableServers[type];
		const availableCount = availables.length;
		if (availableCount <= 0)
		{
			logger.error('not enough servers to scale up.');
			return null;
		}
		if (number > availableCount)
		{
			number = availableCount;
		}
		const servers = availables.slice(0, number);
		availables.splice(0, number);
		return servers;
	}
}

module.exports = ScaleManager;