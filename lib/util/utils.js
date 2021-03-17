const os = require('os');

class Utils
{
	static get RESERVED()
	{
		return {
			CLUSTER_SIGNAL : '++',
			CLUSTER_COUNT  : 'clusterCount',
			CLUSTER_PREFIX : 'cluster-backServer-'
		};
	}
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

	/**
	 * Load cluster server.
	 */
	static LoadCluster(clusterIndex, serverObject, serversArray, serverType)
	{
		const increaseFields = {};
		// const host = server.host;

		const count = parseInt(serverObject[Utils.RESERVED.CLUSTER_COUNT]);
		delete serverObject[Utils.RESERVED.CLUSTER_COUNT];
		for (const key in serverObject)
		{
			if (Object.hasOwnProperty.call(serverObject, key))
			{
				const value = serverObject[key].toString();
				if (value.indexOf(Utils.RESERVED.CLUSTER_SIGNAL) > 0)
				{
					increaseFields[key] = value.slice(0, -2);
				}
			}
		}

		for (let i = 0; i < count; i++, clusterIndex++)
		{
			const currentServerData = Object.assign({}, serverObject);
			currentServerData.id = `${Utils.RESERVED.CLUSTER_PREFIX}${serverType}-${clusterIndex}`;
			for (const k in increaseFields)
			{
				const v = parseInt(increaseFields[k]);
				currentServerData[k] = v + i;
			}
			serversArray.push(currentServerData);
		}
		return clusterIndex;
	}
}

module.exports = Utils;