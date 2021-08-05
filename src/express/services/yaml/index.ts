import { injectable } from 'inversify';
import { cleanEnv, str, email, json, port } from 'envalid';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as yaml from 'js-yaml';

@injectable()
export class Config {

    private config: YamlConfig;
    private filePath: string;

    public constructor(filePath: string) {
        this.filePath = filePath;
        this.config = <YamlConfig>{};
    }

    // todo: read config from server and deploy.
    private async readConfig(): Promise<void> {
        // attempt to read the yml file and potentially throw IO Exception
        const content = await new Promise<string>((resolve, reject) => {
            fs.readFile(path.resolve(process.cwd(), this.filePath), 'utf8', (err, content) => {
                if (err) {
                    return reject(err);
                }
                return resolve(content);
            });
        });
        this.config = <YamlConfig> yaml.safeLoad(content);
    }

    public async getConfig(): Promise<YamlConfig> {
        if (_.isEmpty(this.config)) {
            await this.readConfig();
        }
        this.readENV();
        return this.config;
    }

    private readENV() {
        const env = this.validENV();
        const MONGO_PORT = env.MONGO_PORT;
        this.config.mongodb.port = Number(MONGO_PORT);
        const MONGO_URL = env.MONGO_URL;
        this.config.mongodb.host = String(MONGO_URL);
        const MONGO_USER_NAME = env.MONGO_USER_NAME;
        this.config.mongodb.username = String(MONGO_USER_NAME);
        const MONGO_PASSWORD = env.MONGO_PASSWORD;
        this.config.mongodb.password = String(MONGO_PASSWORD);
        const PORT = env.SERVER_PORT;
        this.config.server_port = Number(PORT);
        const URL = env.SERVER_URL;
        this.config.server_url = String(URL);
        const PASSWORD = env.PASSWORD;
        this.config.password = String(PASSWORD);
        const USERNAME = env.USERNAME;
        this.config.username = String(USERNAME);
    }
    private validENV(): any{
        const env = cleanEnv(process.env, {
            MONGO_URL: str(),
            MONGO_USER_NAME: str(),
            MONGO_PASSWORD: str(),
            NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
            MONGO_PORT: port({ default: 443 }),
            SERVER_PORT: port ({ default: 8080 }),
            SERVER_URL: str(),
            PASSWORD: str(),
            USERNAME: str()
        })
        return env;
    }


}

export interface YamlConfig {
    jwt: JwtConfig,
    mailer: MailerConfig,
    mongodb: MongoConfig,
    server_port: number,
    server_url: string,
    username: string,
    password: string
}

export interface JwtConfig {
    secret: string,
    expireTime: number,
    algorithem: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'PS256' | 'PS384' | 'PS512' | 'none' | undefined,
}

export interface MailerConfig {
    host: string,
    port: number,
    username: string,
    password: string,
    fromAddress: string,
    sendEmail: boolean,
}

export interface MongoConfig {
    host: string,
    port: number,
    username?: string,
    password?: string,
    replicaSetName?: string
}