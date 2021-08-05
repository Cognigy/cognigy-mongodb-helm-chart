/** Node modules */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { join } from "path";
import { safeLoad, safeDump } from "js-yaml";

/* Interfaces */
import { ISecret } from "./interfaces/secret";
import { ISecretWrapper } from "./interfaces/secretWrapper";

/**
 * Creates a random string with given length.
 * @param length The length of the random string
 * @returns A random string of given length
 */
function createRandomString(length: number) {
	return randomBytes(length).toString('hex');
}

/**
 * Base64 encodes a given string.
 * @param str The string to base64 encode
 * @returns The base64 encoded string
 */
function toBase64(str: string) {
	return Buffer.from(str).toString('base64');
}

/**
 * Creates a hex secret with length 64.
 * @returns A 64 character long secret
 */
function createCompactSecret() {
	return createRandomString(64);
}

/**
 * Creates a hex secret with length 128.
 * @returns A 128 character long secret.
 */
function createLongSecret() {
	return createRandomString(128);
}

/**
 * Creates a dummy secret.
 * @returns A dummy secret.
 */
function createDummySecret() {
	return 'aaa';
}

/*
* Checks whether the 'secrets' folder does already exist.
* If not, the path will be created.
*/
export function generateSecretsFolder() {
	const secretsExist = checkSecretsFolder();

	if (secretsExist) {
		console.log("It seems that you already have a 'secrets' folder. We don't want to override your current values! Exiting now.");
		process.exit(0);
	}

	try {
		mkdirSync('secrets');
	} catch (err) {
		console.log("Unable to create folder 'secrets'. Exiting now.");
		process.exit(0);
	}
}

/**
* Checks whether the 'secrets' folder does already exist.
*/
export function checkSecretsFolder() {
	return existsSync('secrets');
}

/**
 * Reads and parses a YAML file at a given fs path.
 * @param path The path to the YAML file to read and parse.
 * @returns Returns JS object of parsed YAML.
 */
export function readAndParseYaml(path: string) {
	try {
		const contents = readFileSync(path, 'utf8');

		return safeLoad(contents);
	} catch (err) {
		console.log(`Failed to load and parse yaml at: ${path}. Exiting now.`);
		process.exit(0);
	}
}

/**
 * Takes an empty k8s secret object and fills it with content.
 * @param secret An empty k8s secret object to be filled.
 */
export function fillSecret(secret: ISecret): ISecretWrapper {
	const { data, metadata } = secret;
	const { name } = metadata;
	const serviceName = name.replace('cognigy-', '');

	if (name === "cognigy-rabbitmq") {
		const rabbitPassword = createCompactSecret();
		const connectionString = `amqp://cognigy:${rabbitPassword}@rabbitmq:5672`;
		const connectionStringApi = `http://cognigy:${rabbitPassword}@rabbitmq:15672/api`;

		return {
			secret: {
				...secret,
				data: {
					...data,
					'connection-string': toBase64(connectionString),
					'rabbitmq-password': toBase64(rabbitPassword),
					'connection-string-api': toBase64(connectionStringApi)
				}
			}
		};
	}

	if (data['connection-string'] !== undefined) {
		const dbPassword = createCompactSecret();
		const connectionString = `mongodb://${serviceName}:${dbPassword}@mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017/${serviceName}`;

		return {
			secret: {
				...secret,
				data: {
					...data,
					'connection-string': toBase64(connectionString)
				}
			},
			serviceName,
			dbPassword
		}
	}

	if (data['mongo-initdb-root-password'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'mongo-initdb-root-password': toBase64(createLongSecret())
				}
			}
		};
	}

	if (data['security-smtp-password'] !== undefined ||
		data['system-smtp-password'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'security-smtp-password': toBase64(createDummySecret()),
					'system-smtp-password': toBase64(createDummySecret())
				}
			}
		};
	}

	if (data['tls.crt'] !== undefined && data['tls.key'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'tls.crt': toBase64(createDummySecret()),
					'tls.key': toBase64(createDummySecret())
				}
			}
		};
	}

	if (data['redis-password.conf'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'redis-password.conf': toBase64(`requirepass ${createCompactSecret()}`)
				}
			}
		};
	}

	if (data['redis-persistent-password.conf'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'redis-persistent-password.conf': toBase64(`requirepass ${createCompactSecret()}`)
				}
			}
		};
	}

	if (data['amazon-client-id'] !== undefined && data['amazon-client-secret'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'amazon-client-id': toBase64(createDummySecret()),
					'amazon-client-secret': toBase64(createDummySecret())
				}
			}
		};
	}

	if (data['fb-verify-token'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'fb-verify-token': toBase64(createCompactSecret())
				}
			}
		};
	}

	if (data['rce-verify-token'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'rce-verify-token': toBase64(createCompactSecret())
				}
			}
		};
	}

	if (data['secret'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'secret': toBase64(createLongSecret())
				}
			}
		};
	}

	if (data['odata-super-api-key'] !== undefined) {
		return {
			secret: {
				...secret,
				data: {
					...data,
					'odata-super-api-key': toBase64(createCompactSecret())
				}
			}
		};
	}

	console.log(`Secret does not have known structure: ${name}`);

	return {} as any;
}

/**
 * Creates a MongoDB complient snippet that will generate a database
 * and a user for a given database.
 * @param serviceName The name of the service to generate a db + user for.
 * @param dbPassword The password of the database to generate.
 * @returns A string - JavaScript snippet that is compatible with MongoDB
 */
export function createSingleDatabaseScriptSnippet(serviceName: string, dbPassword: string) {
	if (!serviceName || !dbPassword) return "";

	let snippet =
		`use ${serviceName}\n` +
		`db.createUser({\n` +
		`	user: "${serviceName}",\n` +
		`	pwd: "${dbPassword}",\n` +
		`	roles: [\n` +
		`		{ role: "readWrite", db: "${serviceName}" }\n` +
		`	]\n` +
		`});\n\n`;

	return snippet;
}

/**
 * Writes a given secret to the disk at path '/core/secrets/{filename}'.
 * @param secret The secret to write
 * @param filename The filename of the secret
 */
export function writeSecret(secret: ISecret, filename: string) {
	let yaml = "";

	try {
		yaml = safeDump(secret);
	} catch (err) {
		console.log(`Failed during YAML rendering. Error was: ${err}. Exiting now.`);
		process.exit(1);
	}

	writeFileSync(join('secrets', filename), yaml);
}

/**
 * Writes a 'dbinit.js' file to disk (current directory)
 * @param contents The contents to write
 */
export function writeDatabaseInitialization(contents: string) {
	writeFileSync(join('.', `dbinit.js`), contents);
}