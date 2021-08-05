import { inject } from 'inversify';
import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, response, requestBody, requestParam } from 'inversify-express-utils';
import { EntityMessageRepository, IEntityMessage } from '../../repository/entityMessageRepository';
import { TYPES } from '../../../constants';
import { Logger } from 'winston';

@controller('/api/v1/entityMessage')
export class EntityMessageController {

    private entityMessage: EntityMessageRepository;
    private logger: Logger;

    public constructor(
        @inject(TYPES.EntityMessageRepository) entityMessage: EntityMessageRepository,
        @inject(TYPES.WinstonLogger) logger: Logger,
    ) {
        this.entityMessage = entityMessage;
        this.logger = logger;
    }

    @httpPost('/new')
    public async newMessage(
        @requestBody() entityMessage: IEntityMessage,
        @response() res: Response): Promise<Response>
    {
        const result = await this.entityMessage.createNewEntityMessage(entityMessage);
        return res.send(result);
    }

    @httpPost('/update')
    public async updateMessage(
        @requestBody() entityMessage: IEntityMessage,
        @response() res: Response): Promise<Response>
    {
        const result = await this.entityMessage.updateEntityMessage(entityMessage._id ,entityMessage);
        return res.send(result);
    }

    @httpGet('/entityMessages/:id')
    public async getMessages(
        @requestParam() param: string | undefined,
        @response() res: Response): Promise<Response>
    {
        if (param) {
            const id:string = JSON.parse(param).id;
            const result = await this.entityMessage.getEntityMessage(id);
            return res.send(result);
        }
        return res.status(400).send("Missing param, entity id.");
    }

    @httpGet('/entitiesMessages/:ids')
    public async getEntitiesMessages(
        @requestParam() param: string | undefined,
        @response() res: Response): Promise<Response>
    {
        if (param) {
            const ids:string[] = JSON.parse(param).ids;
            const result = await this.entityMessage.getEntityMessages(ids);
            return res.send(result);
        }
        return res.status(400).send("Missing params, entities ids.");
    }
}