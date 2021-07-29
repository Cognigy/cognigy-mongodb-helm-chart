"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFiles = void 0;
/** Node modules */
const fs_1 = require("fs");
const path_1 = require("path");
/** Custom modules */
const utils_1 = require("../utils");
function generateFiles() {
    try {
        /** Generate the 'core/secrets' folder if necessary */
        utils_1.generateSecretsFolder();
        /** Read dir contents for 'core/secrets.dist' */
        const files = fs_1.readdirSync('secrets.dist');
        /** Read and parse all yaml files (k8s secrets) */
        let dbCreationScript = "";
        for (const file of files) {
            const parsedSecret = utils_1.readAndParseYaml(path_1.join('secrets.dist', file));
            const { secret, serviceName, dbPassword } = utils_1.fillSecret(parsedSecret);
            if (secret) {
                utils_1.writeSecret(secret, file);
            }
            if (serviceName && dbPassword) {
                dbCreationScript += utils_1.createSingleDatabaseScriptSnippet(serviceName, dbPassword);
            }
        }
        /** Write the initialization script for MongoDB on disk */
        utils_1.writeDatabaseInitialization(dbCreationScript);
    }
    catch (err) {
        console.error(`An error occured. Exiting now. Error was: ${err}`);
        process.exit(1);
    }
    process.exit(0);
}
exports.generateFiles = generateFiles;
//# sourceMappingURL=generate.js.map