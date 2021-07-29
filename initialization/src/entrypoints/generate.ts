/** Node modules */
import { readdirSync } from "fs";
import { join } from "path";

/** Custom modules */
import {
	readAndParseYaml,
	fillSecret,
	writeSecret,
	createSingleDatabaseScriptSnippet,
	writeDatabaseInitialization,
	generateSecretsFolder
} from "../utils";
import { ISecret } from "../interfaces/secret";

export function generateFiles() {
	try {
		/** Generate the 'core/secrets' folder if necessary */
		generateSecretsFolder();

		/** Read dir contents for 'core/secrets.dist' */
		const files = readdirSync('secrets.dist');

		/** Read and parse all yaml files (k8s secrets) */
		let dbCreationScript = "";

		for (const file of files) {
			const parsedSecret = readAndParseYaml(join('secrets.dist', file)) as ISecret;
			const { secret, serviceName, dbPassword } = fillSecret(parsedSecret);

			if (secret) {
				writeSecret(secret, file);
			}

			if (serviceName && dbPassword) {
				dbCreationScript += createSingleDatabaseScriptSnippet(serviceName, dbPassword);
			}
		}

		/** Write the initialization script for MongoDB on disk */
		writeDatabaseInitialization(dbCreationScript);

	} catch (err) {
		console.error(`An error occured. Exiting now. Error was: ${err}`);
		process.exit(1);
	}

	process.exit(0);
}