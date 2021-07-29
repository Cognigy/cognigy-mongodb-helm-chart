/* Interfaces */
import { ISecret } from "./secret";

export interface ISecretWrapper {
	secret: ISecret;
	serviceName?: string;
	dbPassword?: string;
}