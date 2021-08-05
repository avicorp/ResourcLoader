import { injectable, inject } from 'inversify';
import { TYPES } from '../../../constants';
import { ErrorCode } from '../../../express/models/error';

interface ErrorResponse {
    readonly status: number,
    readonly body: ErrorBody | ErrorBodyDebug
}

interface ErrorBody {
    readonly code: ErrorCode,
    readonly description: string,
}

interface ErrorBodyDebug {
    readonly code: ErrorCode,
    readonly description: string,
    readonly debug: string,
}

interface IErrorDescription {
    status: number;
    code: ErrorCode;
    description?: string;
}

@injectable()
export class ErrorHandlerService {


    private errorMap: Map<string, IErrorDescription> = new Map<string, IErrorDescription>([
        ["ERR_AUTH_FAILED", <IErrorDescription> {
            status: 403,
            code: "ERR_AUTH_FAILED",
            description: "You are not authorized to access this application."
        }]
    ]);

    public constructor() {
    }

    public async getErrorResponse(error: Error): Promise<ErrorResponse> {
        const err = this.getErrorDescription(error);
        if (!err) {
            return <ErrorResponse>{
                status: 500,
                body: <ErrorBodyDebug>{
                    code: 'ERR_CODE_NOT_PERSISTED_TO_DATABASE',
                    description: 'Error code not found in the database',
                    debug: error.message
                }
            };
        } else {
            const body: ErrorBodyDebug = 
                <ErrorBodyDebug>{
                    code: err.code,
                    description: err.description + "---- You can deploy error message to the server and control the output of the api user.",
                    debug: error.stack
                };
            return <ErrorResponse>{
                status: err.status,
                body,
            };
        }
    }

    public getErrorDescription(error: Error) : IErrorDescription | undefined {
        return this.errorMap.get(error.message);
    }
}
