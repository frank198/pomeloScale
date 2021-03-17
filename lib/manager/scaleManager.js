const path = require('path');
const utils = require('../util/utils');
const Operator = require('./operator');
const logger = require('pomelo-logger-upgrade').getLogger('pomelo-scale-plugin', __filename);

class ScaleManager
{
	constructor(app, opts)
	{
		this.app = app;
		opts = opts || {};
		this.otherPath = opts.otherPath || '';
		if (!opts.backup)
		{
			throw new Error('no backup servers is available.');
		}
		const serverBackPath = path.join(this.app.getBase(), opts.backup);
		const backServers = require(serverBackPath);
		this.availableServers = this._parseBackupServers(backServers);
		this.cacheAvailableServers = JSON.parse(JSON.stringify(this.availableServers));
		this.scaleObject = new Map();
	}

	_parseBackupServers(backServers)
	{
		const serverTypes = Object.keys(backServers);
		for (let i = 0, length = serverTypes.length; i < length; i++) {
			const serverType = serverTypes[i];
			if (!serverType) continue;
			const serverData = backServers[serverType];
			const servers = serverData.servers;
			if (servers && Array.isArray(servers) && servers.length > 0)
			{
				const currentServers = [];
				let clusterIndex = 0;
				for (let j = 0, length = servers.length; j < length; j++)
				{
					const serverObject = servers[j];
					if (serverObject[utils.RESERVED.CLUSTER_COUNT])
					{
						clusterIndex = utils.LoadCluster(clusterIndex, serverObject, currentServers, serverType);
					}
				}
				backServers[serverType].servers = currentServers;
			}
		}
		return backServers;
	}

	start()
	{
		const serverTypes = Object.keys(this.availableServers);
		for (let i = 0, length = serverTypes.length; i < length; i++) {
			const serverType = serverTypes[i];
			if (!serverType) continue;
			const serverData = this.availableServers[serverType];
			const types = serverData.type;
			serverData.serverType = serverType;
			if (Array.isArray(types))
			{
				for (let j = 0, count = types.length; j < count; j++) {
					const type = types[j];
					if (type)
						this.setOperator(type, serverData);
				}
			}
			else
			{
				this.setOperator(types, serverData);
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
					const otherClass = require(path.join(this.app.getBase(), this.otherPath, conditions.otherClass));
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