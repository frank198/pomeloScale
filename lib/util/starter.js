
const utils = require('./utils');
const spawn = require('child_process').spawn;
const logger = require('pomelo-logger').getLogger('pomelo-scale-plugin', __filename);

class Starter
{
	static Run(app, server, cb)
    {
		const env = app.get('env');
		let cmd, key;
		if (utils.IsLocal(server.host))
        {
			const options = [];
			if (server.args)
            {
				if (typeof server.args === 'string')
                {
					options.push(server.args.trim());
				}
				else
                {
					options.push(server.args);
				}
			}
			cmd = app.get('main');
			options.push(cmd);
			options.push(`env=${env}`);
			for (key in server)
            {
				if (server.hasOwnProperty(key))
					options.push(`${key}=${server[key]}`);
			}
			StarterUtility.Localrun(process.execPath, null, options, env, cb);
		}
		else
        {
			cmd = `cd "${app.getBase()}" && "${process.execPath}"`;
			const arg = server.args;
			if (arg !== null)
            {
				cmd += arg;
			}
			cmd += ` "${app.get('main')}" env=${env} `;
			for (key in server)
			{
	            if (server.hasOwnProperty(key)) cmd += ` ${key}=${server[key]} `;
			}
			StarterUtility.SSHRun(cmd, server.host, env, cb);
		}
	}
}

class StarterUtility
{
	static SSHRun(cmd, host, env, cb)
    {
		StarterUtility.SpawnProcess('ssh', host, [host, cmd], env, cb);
	}

	static LocalRun(cmd, host, options, env, callback)
    {
		StarterUtility.SpawnProcess(cmd, host, options, env, callback);
	}

	static SpawnProcess(command, host, options, env, cb)
    {
		let child = null;
		if (env === 'development')
        {
			child = spawn(command, options);
			const prefix = command === 'ssh' ? `[${host}] ` : '';

			child.stderr.on('data', function(chunk)
            {
				const msg = chunk.toString();
				process.stderr.write(msg);
				utils.InvokeCallback(cb, msg);
			});

			child.stdout.on('data', function(chunk)
            {
				const msg = prefix + chunk.toString();
				process.stdout.write(msg);
			});
		}
		else
        {
			child = spawn(command, options, {
				detached : true,
				stdio    : 'inherit'});
			child.unref();
		}

		child.on('exit', function(code)
        {
			if (code !== 0)
            {
				logger.warn('child process exit with error, error code: %s, executed command: %s', code, command);
			}
			if (typeof cb === 'function')
            {
				cb(code === 0 ? null : code);
			}
		});
	}
}

module.exports = Starter;