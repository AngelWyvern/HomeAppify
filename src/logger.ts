export enum LogLevel
{
	Info = 'INFO',
	Warning = 'WARN',
	Error = 'ERR.'
}

export namespace logger
{
	export function log(level:LogLevel, v:any):void
	{
		let out:string = '\x1b[1m';
	
		switch (level)
		{
			case LogLevel.Info:
				out += '\x1b[34m';
				break;
			case LogLevel.Warning:
				out += '\x1b[33m';
				break;
			case LogLevel.Error:
				out += '\x1b[31m';
				break;
		}
	
		const date:Date = new Date();
		out += '[ ' + level + ' | ' + date.toLocaleDateString(undefined, {month:"2-digit", day:"2-digit", year:"2-digit"}) + ' • ' + date.toLocaleTimeString(undefined, {hour12:false, hour:"2-digit", minute:"2-digit"}) + ' ]\x1b[0m ' + v;
	
		console.log(out);
	}

	export function info(v:any):void
	{
		return log(LogLevel.Info, v);
	}

	export function warn(v:any):void
	{
		return log(LogLevel.Warning, v);
	}

	export function error(v:any):void
	{
		return log(LogLevel.Error, v);
	}
}
