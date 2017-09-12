const path = require('path');
const Operator = require('./operator');
const logger = require('pomelo-logger').getLogger('pomelo-scale-plugin', __filename);

class ScaleManager
{
	constructor(app, conditions)
	{
		this.app = app;
		conditions = conditions || {};
		if (!conditions.backup)
		{
			throw new Error('no backup servers is available.');
		}
		this.backup = path.join(this.app.getBase(), conditions.backup);
		this.availableServers = require(this.backup);
		this.cacheAvailableServers = JSON.parse(JSON.stringify(this.availableServers));
		this.scaleObject = new Map();
	}

	start()
	{
		const serverTypes = Object.keys(this.availableServers);
		let i = 0, serverType = null, type = null;
		while (serverType = serverTypes[i++])
		{
			const conditions = this.availableServers[serverType];
			const types = conditions.type;
			conditions.serverType = serverType;
			if (Array.isArray(types))
			{
				let j = 0;
				while (type = types[j++])
				{
					this.setOperator(type, conditions);
				}
			}
			else
			{
				this.setOperator(types, conditions);
			}
		}
	}

	getOperator(serverType, type)
	{
		if (!serverType || !type) return null;
		return this.scaleObject.get(`${type}_${serverType}`);
	}

	setOperator(type, conditions)
	{
		const serverType = conditions.serverType;
		if (serverType && serverType.length > 0)
		{
			let operator = this.getOperator(serverType, type);
			if (operator) return operator;
			switch (type)
			{
			case 'cpu':
			case 'memory':
				operator = new Operator(this, this.app, conditions, type);
				break;
			default:
				if (conditions.hasOwnProperty('otherClass'))
				{
					const otherClass = require(path.join(this.app.getBase(), conditions.otherClass));
					delete conditions.otherClass;
					operator = new otherClass(this, this.app, conditions, require('../util/starter').Run);
				}
				else
				{
					operator = new Operator(this, this.app, conditions, type);
				}
				break;
			}
			operator.start();
			this.scaleObject.set(`${type}_${serverType}`, operator);
			return operator;
		}
		return null;
	}

	getAvailableServers(serverType, number)
	{
		const availables = this.availableServers[serverType].servers;
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

	getAvailableServersCount(serverType)
	{
		const availables = this.availableServers[serverType].servers;
		return Array.isArray(availables) ? availables.length : 0;
	}
}

module.exports = ScaleManager;