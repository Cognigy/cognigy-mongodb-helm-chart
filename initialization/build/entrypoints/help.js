"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHelp = void 0;
/** Node modules */
const commandLineUsage = require("command-line-usage");
/** Define usage information */
const sections = [
    {
        header: "Initialization script for Cognigy.AI and kubernetes (k8s)",
        content: "Helps with the initial installation process of a Cognigy.AI installation on top of Kubernetes."
    },
    {
        header: "Options",
        optionList: [
            {
                name: "help",
                alias: "h",
                description: "Prints this usage guide."
            },
            {
                name: "version",
                description: "Shows the version of the initialization tool you are currently using."
            },
            {
                name: "generate",
                alias: "g",
                description: `Adjusts the placeholders in your 'secrets' folder
				and generates secure random credentials. You might want to adjust
				certain secrets before you apply them to your cluster.`
            }
        ]
    }
];
function renderHelp() {
    const usage = commandLineUsage(sections);
    console.log(usage);
    process.exit(0);
}
exports.renderHelp = renderHelp;
//# sourceMappingURL=help.js.map