export interface ConfigData
{
	ws:{ host:string, port:number },
	http:{ host:string, port:number },
	https:{ host:string, port:number },
	dns:{ host:string, port:number, reroute:string },
	pwa:{ iconSizes:Array<string> }
}

export interface Manifest
{
	name?:string,
	short_name?:string,
	icons?:Array<ManifestIconData>,
	start_url?:string,
	display?:DisplayMode,
	orientation?:DeviceOrientation,
	background_color?:string,
	theme_color?:string
}

export interface ManifestIconData
{
	src:string,
	sizes:string,
	type:string
}

export enum DisplayMode
{
	Standalone = 'standalone',
	Fullscreen = 'fullscreen',
	MinimalUI = 'minimal-ui'
}

export enum DeviceOrientation
{
	Any = 'any',
	Portrait = 'portrait',
	Landscape = 'landscape'
}