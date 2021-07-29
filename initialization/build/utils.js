"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDatabaseInitialization = exports.writeSecret = exports.createSingleDatabaseScriptSnippet = exports.fillSecret = exports.readAndParseYaml = exports.checkSecretsFolder = exports.generateSecretsFolder = void 0;
/** Node modules */
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
const js_yaml_1 = require("js-yaml");
/**
 * Creates a random string with given length.
 * @param length The length of the random string
 * @returns A random string of given length
 */
function createRandomString(length) {
    return crypto_1.randomBytes(length).toString('hex');
}
/**
 * Base64 encodes a given string.
 * @param str The string to base64 encode
 * @returns The base64 encoded string
 */
function toBase64(str) {
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
function generateSecretsFolder() {
    const secretsExist = checkSecretsFolder();
    if (secretsExist) {
        console.log("It seems that you already have a 'secrets' folder. We don't want to override your current values! Exiting now.");
        process.exit(0);
    }
    try {
        fs_1.mkdirSync('secrets');
    }
    catch (err) {
        console.log("Unable to create folder 'secrets'. Exiting now.");
        process.exit(0);
    }
}
exports.generateSecretsFolder = generateSecretsFolder;
/**
* Checks whether the 'secrets' folder does already exist.
*/
function checkSecretsFolder() {
    return fs_1.existsSync('secrets');
}
exports.checkSecretsFolder = checkSecretsFolder;
/**
 * Reads and parses a YAML file at a given fs path.
 * @param path The path to the YAML file to read and parse.
 * @returns Returns JS object of parsed YAML.
 */
function readAndParseYaml(path) {
    try {
        const contents = fs_1.readFileSync(path, 'utf8');
        return js_yaml_1.safeLoad(contents);
    }
    catch (err) {
        console.log(`Failed to load and parse yaml at: ${path}. Exiting now.`);
        process.exit(0);
    }
}
exports.readAndParseYaml = readAndParseYaml;
/**
 * Takes an empty k8s secret object and fills it with content.
 * @param secret An empty k8s secret object to be filled.
 */
function fillSecret(secret) {
    const { data, metadata } = secret;
    const { name } = metadata;
    const serviceName = name.replace('cognigy-', '');
    if (name === "cognigy-rabbitmq") {
        const rabbitPassword = createCompactSecret();
        const connectionString = `amqp://cognigy:${rabbitPassword}@rabbitmq:5672`;
        const connectionStringApi = `http://cognigy:${rabbitPassword}@rabbitmq:15672/api`;
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'connection-string': toBase64(connectionString), 'rabbitmq-password': toBase64(rabbitPassword), 'connection-string-api': toBase64(connectionStringApi) }) })
        };
    }
    if (data['connection-string'] !== undefined) {
        const dbPassword = createCompactSecret();
        const connectionString = `mongodb://${serviceName}:${dbPassword}@mongodb-0.mongodb-headless:27017,mongodb-1.mongodb-headless:27017,mongodb-2.mongodb-headless:27017/${serviceName}`;
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'connection-string': toBase64(connectionString) }) }),
            serviceName,
            dbPassword
        };
    }
    if (data['mongo-initdb-root-password'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'mongo-initdb-root-password': toBase64(createLongSecret()) }) })
        };
    }
    if (data['security-smtp-password'] !== undefined ||
        data['system-smtp-password'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'security-smtp-password': toBase64(createDummySecret()), 'system-smtp-password': toBase64(createDummySecret()) }) })
        };
    }
    if (data['tls.crt'] !== undefined && data['tls.key'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'tls.crt': toBase64(createDummySecret()), 'tls.key': toBase64(createDummySecret()) }) })
        };
    }
    if (data['redis-password.conf'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'redis-password.conf': toBase64(`requirepass ${createCompactSecret()}`) }) })
        };
    }
    if (data['redis-persistent-password.conf'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'redis-persistent-password.conf': toBase64(`requirepass ${createCompactSecret()}`) }) })
        };
    }
    if (data['amazon-client-id'] !== undefined && data['amazon-client-secret'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'amazon-client-id': toBase64(createDummySecret()), 'amazon-client-secret': toBase64(createDummySecret()) }) })
        };
    }
    if (data['fb-verify-token'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'fb-verify-token': toBase64(createCompactSecret()) }) })
        };
    }
    if (data['rce-verify-token'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'rce-verify-token': toBase64(createCompactSecret()) }) })
        };
    }
    if (data['secret'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'secret': toBase64(createLongSecret()) }) })
        };
    }
    if (data['odata-super-api-key'] !== undefined) {
        return {
            secret: Object.assign(Object.assign({}, secret), { data: Object.assign(Object.assign({}, data), { 'odata-super-api-key': toBase64(createCompactSecret()) }) })
        };
    }
    console.log(`Secret does not have known structure: ${name}`);
    return {};
}
exports.fillSecret = fillSecret;
/**
 * Creates a MongoDB complient snippet that will generate a database
 * and a user for a given database.
 * @param serviceName The name of the service to generate a db + user for.
 * @param dbPassword The password of the database to generate.
 * @returns A string - JavaScript snippet that is compatible with MongoDB
 */
function createSingleDatabaseScriptSnippet(serviceName, dbPassword) {
    if (!serviceName || !dbPassword)
        return "";
    let snippet = `use ${serviceName}\n` +
        `db.createUser({\n` +
        `	user: "${serviceName}",\n` +
        `	pwd: "${dbPassword}",\n` +
        `	roles: [\n` +
        `		{ role: "readWrite", db: "${serviceName}" }\n` +
        `	]\n` +
        `});\n\n`;
    return snippet;
}
exports.createSingleDatabaseScriptSnippet = createSingleDatabaseScriptSnippet;
/**
 * Writes a given secret to the disk at path '/core/secrets/{filename}'.
 * @param secret The secret to write
 * @param filename The filename of the secret
 */
function writeSecret(secret, filename) {
    let yaml = "";
    try {
        yaml = js_yaml_1.safeDump(secret);
    }
    catch (err) {
        console.log(`Failed during YAML rendering. Error was: ${err}. Exiting now.`);
        process.exit(1);
    }
    fs_1.writeFileSync(path_1.join('secrets', filename), yaml);
}
exports.writeSecret = writeSecret;
/**
 * Writes a 'dbinit.js' file to disk (current directory)
 * @param contents The contents to write
 */
function writeDatabaseInitialization(contents) {
    fs_1.writeFileSync(path_1.join('.', `dbinit.js`), contents);
}
exports.writeDatabaseInitialization = writeDatabaseInitialization;
//# sourceMappingURL=utils.js.map