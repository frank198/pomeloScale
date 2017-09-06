const path = require('path');
const Operator = require('./operator');
const logger = require('pomelo-logger').getLogger('pomelo-scale-plugin', __filename);

class ScaleManager
{
	constructor(app, conditions) {
		this.app = app;
		conditions = conditions || {};
		this.cpuConditions = conditions.cpu;
		this.memoryConditions = conditions.memory;
		this.backup = conditions.backup;
		this.otherConditions = conditions.other;
		if (!this.backup) {
			throw new Error('no backup servers is available.');
		}

		this.backup = path.join(this.app.getBase(), this.backup);
		this.availableServers = require(this.backup);
		this.scaleObject = new Map();
	}

	start()
	{
		if (this.cpuConditions)
		{
			if (Array.isArray(this.cpuConditions))
			{
				let cpuCondition, i = 0;
				while (cpuCondition = this.cpuConditions[i++])
				{
					const cpuOperator = new Operator(this, this.app, cpuCondition, 'cpu');
					cpuOperator.start();
					this.scaleObject.set(`cpu_${cpuOperator.serverType}`, cpuOperator);
				}
			}
			else
			{
				const cpuOperator = new Operator(this, this.app, this.cpuConditions, 'cpu');
				cpuOperator.start();
				this.scaleObject.set(`cpu_${cpuOperator.serverType}`, cpuOperator);
			}
		}

		if (this.memoryConditions)
		{
			if (Array.isArray(this.memoryConditions))
			{
				let memoryCondition, i = 0;
				while (memoryCondition = this.memoryConditions[i++])
				{
					const memoryOperator = new Operator(this, this.app, memoryCondition, 'memory');
					memoryOperator.start();
					this.scaleObject.set(`memory_${memoryOperator.serverType}`, memoryOperator);
				}
			}
			else
			{
				const memoryOperator = new Operator(this, this.app, this.memoryConditions, 'memory');
				memoryOperator.start();
				this.scaleObject.set(`memory_${memoryOperator.serverType}`, memoryOperator);
			}
		}

		if (this.otherConditions)
		{
			let otherOperator = null;
			if (Array.isArray(this.memoryConditions))
			{
				let otherCondition, i = 0;
				while (otherCondition = this.otherConditions[i++])
				{
					if (otherCondition.hasOwnProperty('otherClass'))
					{
						const otherClass = otherCondition.otherClass;
						delete otherCondition.otherClass;
						otherOperator = new otherClass(this, this.app, otherCondition, require('../util/starter').Run);
					}
					else
					{
						otherOperator = new Operator(this, this.app, otherCondition, 'other');
					}
					otherOperator.start();
					this.scaleObject.set(`other_${otherOperator.serverType}`, otherOperator);
				}
			}
			else
			{
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
				this.scaleObject.set(`other_${otherOperator.serverType}`, otherOperator);
			}
		}
	}

	getAvailableServers(type, number)
	{
		const availables = this.availableServers[type];
		const availableCount = Array.isArray(availables) ? availables.length : 0;
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

	getAvailableServersCount(type)
	{
		const availables = this.availableServers[type];
		return Array.isArray(availables) ? availables.length : 0;
	}
}

module.exports = ScaleManager;
module.exports.name = '__scaleManager__';