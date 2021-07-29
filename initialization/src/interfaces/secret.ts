export interface ISecret {
	metadata: {
		name: string;
	};
	data: {
		'connection-string'?: string;
		'rabbitmq-password'?: string;
		'connection-string-api'?: string;
		'mongo-initdb-root-password'?: string;
		'security-smtp-password'?: string;
		'system-smtp-password'?: string;
		'tls.crt'?: string;
		'tls.key'?: string;
		'redis-persistent-password.conf'?: string;
		'redis-password.conf'?: string;
		'amazon-client-id'?: string;
		'amazon-client-secret'?: string;
		'fb-verify-token'?: string;
		'rce-verify-token'?: string;
		'secret'?: string;
		'odata-super-api-key'?: string;
	};
}