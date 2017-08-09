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
		this.run = condition.run || runners[type];
		this.schedule = (condition.schedule || OperatorUtility.schedule).bind(this);
		this.isScale = (condition.isScale || OperatorUtility.isScale).bind(this);
		this.interval = condition.interval || DEFAULT_INTERVAL;
		this.increasement = condition.increasement || DEFAULT_INCREASE;
	}

	start()
	{
		this.intervalId = setInterval(this.schedule, this.interval, this);
	}

	scale(type)
	{
		const servers = this.manager.getAvailableServers(type, this.increasement);
		const serversCount = this.manager.getAvailableServersCount(type);
		if (servers)
		{
			for (let j = 0; j < servers.length; j++)
			{
				servers[j].serverType = type;
				starter.Run(this.app, servers[j]);
			}
		}
		if (serversCount <= 0)
		{
			clearInterval(this.intervalId);
		}
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
		for (const key in this.condition)
		{
			if (this.condition.hasOwnProperty(key))
			{
				const servers = this.app.getServersByType(key);
				if (Boolean(servers) && Boolean(servers.length))
				{
					((key) =>
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
							if (this.isScale(key, results))
							{
								this.scale(key);
							}
						});
					})(key);
				}
			}

		}
	}

	static isScale(type, results)
	{
		let total = 0;
		for (let i = 0; i < results.length; i++)
		{
			total += Number(results[i]);
		}
		const average = Math.round(total / results.length);
		return average > this.condition[type];
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