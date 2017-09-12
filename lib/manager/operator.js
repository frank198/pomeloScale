const asyncMap = require('async').map;
const exec = require('child_process').exec;
const starter = require('../util/starter');
const logger = require('pomelo-logger').getLogger('pomelo-scale-plugin', __filename);

const DEFAULT_INCREASE = 1;
const DEFAULT_INTERVAL = 5 * 60 * 1000;

class Operator
{
	constructor(manager, app, condition, type)
	{
		this.app = app;
		this.type = type;
		this.manager = manager;
		this.condition = condition;
		this.serverType = condition.serverType;
		this.scaleCondition = condition.scaleCondition;
		this.run = condition.run || runners[type];
		this.schedule = (condition.schedule || OperatorUtility.schedule).bind(this);
		this.isScale = (condition.isScale || OperatorUtility.isScale).bind(this);
		this.interval = condition.interval || DEFAULT_INTERVAL;
		this.increasement = condition.increasement || DEFAULT_INCREASE;
		this.intervalId = null;
	}

	start()
	{
		if (this.intervalId !== null) return;
		if (this.manager.getAvailableServersCount(this.serverType) > 0)
		{
			this.intervalId = setInterval(this.schedule, this.interval, this);
		}
	}

	scale()
	{
		const servers = this.manager.getAvailableServers(this.serverType, this.increasement);
		const serversCount = this.manager.getAvailableServersCount(this.serverType);
		if (servers)
		{
			for (let j = 0; j < servers.length; j++)
			{
				servers[j].serverType = this.serverType;
				starter.Run(this.app, servers[j]);
			}
		}
		if (serversCount <= 0)
		{
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	get isRun()
	{
		return this.intervalId !== null;
	}
}

module.exports = Operator;

class OperatorUtility
{
	static CPURunner(pid, cb)
	{
		exec(`ps aux|grep ${pid}|grep -v grep|awk '{print $3}'`, (error, stdout, stderr) =>
		{
			cb(error, stdout.slice(0, -1));
		});
	}

	static schedule()
	{
		const servers = this.app.getServersByType(this.serverType);
		if (Array.isArray(servers) && servers.length > 0)
		{
			asyncMap(servers, (server, callback) =>
			{
				this.run(server.pid, (err, data) =>
				{
					callback(err, data);
				});
			}, (err, results) =>
			{
				if (err)
				{
					logger.error('check server with error, err: %j', err.stack);
					return;
				}
				if (this.isScale(this.scaleCondition, results))
				{
					this.scale();
				}
			});
		}
	}

	static isScale(scaleCondition, results)
	{
		let total = 0;
		for (let i = 0; i < results.length; i++)
		{
			total += Number(results[i]);
		}
		const average = Math.round(total / results.length);
		return average > scaleCondition;
	}

	static MemoryRunner(pid, cb)
	{
		exec(`ps aux|grep ${pid}|grep -v grep|awk '{print $4}'`, (error, stdout, stderr) =>
		{
			cb(error, stdout.slice(0, -1));
		});
	}
}

const runners = {
	cpu    : OperatorUtility.CPURunner,
	memory : OperatorUtility.MemoryRunner
};