import * as commandLineArgs from "command-line-args";

/** Custom modules */
import { renderHelp } from "./entrypoints/help";
import { showVersion } from "./entrypoints/version";
import { generateFiles } from "./entrypoints/generate";

/** Define all options/params this CLI can handle */
const optionDefinitions: commandLineArgs.OptionDefinition[] = [
	{
		name: 'help',
		alias: 'h'
	},
	{
		name: 'version'
	},
	{
		name: 'generate',
		alias: 'g'
	}
];

(async () => {
	/** Parse CLI arguments */
	let options: commandLineArgs.CommandLineOptions;
	try {
		options = commandLineArgs(optionDefinitions);
	} catch (e) {
		console.error("Unknown argument used! Use '--help' to get more usage information!");
		process.exit(1);
	}

	/** Render help */
	if (options.help !== undefined) {
		renderHelp();
	}

	/** Render version */
	if (options.version !== undefined) {
		showVersion();
	}

	/** Generate secrets (main) */
	if (options.generate !== undefined) {
		generateFiles();
	}

	/** Render help by default */
	renderHelp();
})();