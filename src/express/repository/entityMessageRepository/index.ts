import { injectable } from 'inversify';
import { Schema, Model, model, Document } from "mongoose";

export enum MessageType {
    warning = "warning",
    info = "info",
    disable = "disable"
}

export interface IUser extends Document {
    name: string,
    id: string
}

export interface IEntityMessage extends Document {
    entityId: string,
    user: IUser,
    lastModifiedDate: Date,
    fieldName: string,
    message: string,
    status: MessageType
}


const entityMessageSchema: Schema = new Schema({
    entityId: { type: String, index: true, trim: true },
    user: {
        name: { type: String, trim: true },
        id: { type: String, trim: true }
    },
    lastModifiedDate: {
        type: Date,
        default: Date.now
    },
    fieldName: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, trim: true }
});

const EntityMessage: Model<IEntityMessage> = model('EntityMessage', entityMessageSchema);

export { EntityMessage };

@injectable()
export class EntityMessageRepository {

    public constructor() {}

    public async createNewEntityMessage(entityMessage: IEntityMessage): Promise<IEntityMessage> {
        const newEntityMessage = await EntityMessage.create(entityMessage);
        return newEntityMessage;
    }

    public async updateEntityMessage(id:any ,entityMessage: IEntityMessage): Promise<IEntityMessage | null> {
        const updatedEntityMessage = await EntityMessage.findByIdAndUpdate(id, 
            entityMessage);
        return updatedEntityMessage;
    }

    public async getEntityMessage(entityId:string): Promise<IEntityMessage[]> {
        const updatedEntityMessage = await EntityMessage.find({ entityId: entityId });
        return updatedEntityMessage;
    }

    public async getEntityMessages(entityId:string[]): Promise<IEntityMessage[]> {
        const updatedEntityMessage = await EntityMessage.find({  }).where('entityId').in(entityId);
        return updatedEntityMessage;
    }
}