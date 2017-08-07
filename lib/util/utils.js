const os = require('os');

class Utils
{
	/**
     * Invoke callback with check
     * @param cb
     * @param args
     */
	static InvokeCallback(cb, ...args)
	{
		if (Boolean(cb) && typeof cb === 'function')
		{
			const arg = Array.from ? Array.from(args) : [].slice.call(args);
			cb(...arg);
		}
	}

	static IsLocal(host)
	{
		return host === '127.0.0.1' || host === 'localhost' || Utils.InLocal(host);
	}

	static InLocal(host)
	{
		const localIps = Utils.LocalIps;
		return localIps.includes(host);
	}

	static get LocalIps()
	{
		const ifaces = os.networkInterfaces();
		const ips = [];
		const func = (details) =>
		{
			if (details.family === 'IPv4')
			{
				ips.push(details.address);
			}
		};
		for (const dev in ifaces)
		{
			ifaces[dev].forEach(func);
		}
		return ips;
	}
}

module.exports = Utils;