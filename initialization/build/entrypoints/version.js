"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVersion = void 0;
/* Node modules */
const packageJson = require("../../package.json");
function showVersion() {
    console.log(`You are using 'initialization' in version: ${packageJson.version}`);
    process.exit(0);
}
exports.showVersion = showVersion;
//# sourceMappingURL=version.js.map