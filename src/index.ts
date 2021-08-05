import 'reflect-metadata';
import passport from 'passport';
import cors from 'cors';
import * as express from 'express';
import { createLogger, format, transports, Logger, LoggerOptions } from 'winston';
import { Application, Request, Response, NextFunction } from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import * as bodyParser from 'body-parser';
// import the middleware
import { AuthMiddleware } from './express/middleware';
// import the DAO class

// import other services
import { Config, YamlConfig } from './express/services/yaml';
import { PassportService } from './express/services/passport';
import { MongoDbService } from './express/services/mongodb';
import { TYPES } from './constants';
// import the controller
import './express/controllers/entityMessageController';

import { Format } from 'logform';
import { EntityMessageRepository } from './express/repository/entityMessageRepository';

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

(async () => {
    // load everthing needed to the container
    const container = new Container();

    // bind the config reader
    const yml: Config = new Config('app.config.yml');
    const config: YamlConfig = await yml.getConfig();

    // bind the Yaml configuration and other constant value
    container.bind<Logger>(TYPES.WinstonLogger).toConstantValue(logger);
    container.bind<YamlConfig>(TYPES.Config).toConstantValue(config);

    // bind the DAO class
    container.bind<EntityMessageRepository>(TYPES.EntityMessageRepository).to(EntityMessageRepository).inSingletonScope();
    
    // bind other services
    container.bind<MongoDbService>(TYPES.MongoDbService).to(MongoDbService).inSingletonScope();
    container.bind<PassportService>(TYPES.PassportService).to(PassportService).inSingletonScope();
    // configure mongodb and connect to it
    const mongodb = container.get<MongoDbService>(TYPES.MongoDbService);
    await mongodb.connectDb();
    // configure PassportJS config and start the create user loop
    const passportConfig = container.get<PassportService>(TYPES.PassportService);
    passportConfig.init()

    // bind the express middleware
    container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

    // start the express server
    const server = new InversifyExpressServer(container);
    server.setConfig((app: Application) => {
        // set cors
        if (process.env.NODE_ENV == 'development') {
            app.use(cors());
        }
        // set the body parser
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(bodyParser.json());
        // set passportjs
        app.use(passport.initialize());
        app.use(passport.session());
    });

    // build the server instance
    const instance = server.build();
    instance.listen(config.server_port);
    // log to the console to indicate the server has been started
    logger.info(`Server is listening on port ${config.server_port}`);
})();
