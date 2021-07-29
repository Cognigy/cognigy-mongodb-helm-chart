/* Node modules */
const packageJson = require("../../package.json");

export function showVersion() {
	console.log(`You are using 'initialization' in version: ${packageJson.version}`);

	process.exit(0);
}