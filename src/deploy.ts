import 'reflect-metadata';
import * as fs from 'fs';
import axios from "axios";
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Container } from 'inversify';
import { Format } from 'logform';
import { createLogger, format, transports, Logger, LoggerOptions } from 'winston';
import { Config, YamlConfig } from './express/services/yaml';
import { TYPES } from './constants';

// load everthing needed to the container
const container = new Container();

const path = { 
    0 : "./express/controllers",
    1 : "./express/repository"
}

enum ResourcStatus {
    pending = 0,
    disable = 1,
    online = 2
}

interface UserResponse {
    user: UserObj,
    jwt: string
}

interface ResourceResponse {
    user: UserObj,
    reasource: string
    status: ResourcStatus
}

interface UserObj {
    username: string,
    id: string
}

interface IController{
    controllerName:  string,
    code: string,
    status: ResourcStatus
};


interface IRepository{
    repositoryName:  string,
    code: string,
    status: ResourcStatus
};

function getServerConfig(): AxiosRequestConfig {
    const config = <YamlConfig>container.get(TYPES.Config);
    const serverConfig = <AxiosRequestConfig>{
        baseURL: `${config.server_url}:${config.server_port}`
    };

    return serverConfig;
}

function getFileInDir(path:string): string[] {
    const controllerList: string[] = fs.readdirSync(path);
    return controllerList;
}


function buildResource(name:string, type:0|1): IRepository | IController {
    const codePath = path[type] + "/" + name + "/index.js";
    console.log(codePath);
    const code = fs.readFileSync(codePath, 'utf8');
    const Resourc: IRepository | IController = type? 
        <IRepository>{
            repositoryName: name,
            code: code,
            status: ResourcStatus.pending
        } : <IController> {
            controllerName: name,
            code: code,
            status: ResourcStatus.pending
        }
    return Resourc;
}

async function loginUsers(email: string, password: string): Promise<AxiosResponse<UserResponse>> {
    const config = getServerConfig();

    let user = {
        email: email,
        password: password,
    };
    const responseLogin = await axios.post<UserResponse>('/api/v1/auth/login', user, config);
    const result = Promise.resolve(responseLogin);
    return result;
}

async function sendResource(jwt: string, resource: IRepository | IController ): Promise<AxiosResponse<ResourceResponse>>{
    const config = getServerConfig();

    const deployResourcBody = {
        resource: resource,
        jwt: `Bearer ${jwt}`
    };

    const responseLogin = await axios.post<ResourceResponse>('/api/v1/resources/new', deployResourcBody, config);
    const result = Promise.resolve(responseLogin);
    return result;
}

async function deployResources(jwt: string, type:0|1): Promise<AxiosResponse<ResourceResponse>[]>{
    const listOfResources = getFileInDir(path[type]);
    const responses:AxiosResponse<ResourceResponse>[] = [];

    listOfResources.forEach(
        async resourceDir =>  {
            const newResource = buildResource(resourceDir, type);
            const resurce  = await sendResource(jwt, newResource);
            responses.push(resurce);
        }
    );
    const result = Promise.all(responses);
    return result;
}

async function runDeploy() {
    // bind the config reader
    const yml: Config = new Config('./../app.config.yml');
    const config: YamlConfig = await yml.getConfig();

    // bind the Yaml configuration and other constant value
    container.bind<Logger>(TYPES.WinstonLogger).toConstantValue(logger);
    container.bind<YamlConfig>(TYPES.Config).toConstantValue(config);

    try {
        const login  = await loginUsers(config.username, config.password);
        const resultRepository = await deployResources(login.data.jwt, 0);
        const resultController = await deployResources(login.data.jwt, 1);
        const dataR= resultRepository.map((elem) => { return elem.data });
        const dataC= resultController.map((elem) => { return elem.data });
        console.log(dataR);
        console.log(dataC);
    } catch (err) {
        console.log(err);
    }

}

// configure the winston logger
const fmt: Format = format.printf((info) => {
    return `[${info.timestamp} ${info.level}]: ${info.message}`;
});

const logger: Logger = createLogger(<LoggerOptions>{
    level: 'debug',
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        fmt,
    ),
    transports: [
        new transports.Console({ level: 'debug' }),
        // new transports.File({ filename: 'sample-app.log' }),
    ],
});

runDeploy();