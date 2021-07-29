"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandLineArgs = require("command-line-args");
/** Custom modules */
const help_1 = require("./entrypoints/help");
const version_1 = require("./entrypoints/version");
const generate_1 = require("./entrypoints/generate");
/** Define all options/params this CLI can handle */
const optionDefinitions = [
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
    let options;
    try {
        options = commandLineArgs(optionDefinitions);
    }
    catch (e) {
        console.error("Unknown argument used! Use '--help' to get more usage information!");
        process.exit(1);
    }
    /** Render help */
    if (options.help !== undefined) {
        help_1.renderHelp();
    }
    /** Render version */
    if (options.version !== undefined) {
        version_1.showVersion();
    }
    /** Generate secrets (main) */
    if (options.generate !== undefined) {
        generate_1.generateFiles();
    }
    /** Render help by default */
    help_1.renderHelp();
})();
//# sourceMappingURL=index.js.map