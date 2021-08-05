import { inject, injectable } from 'inversify';
import * as bcrypt from 'bcrypt';
import passport from 'passport';
import passportLocal from 'passport-local';
import { Logger } from 'winston';
import { TYPES } from '../../../constants';

export interface Task {
    func: () => Promise<void>;
}

@injectable()
export class PassportService {
    private logger: Logger;

    public constructor(
        @inject(TYPES.WinstonLogger) logger: Logger,
    ) {
        this.logger = logger;
    }

    public init() {
        // Take user object, store information in a session
        // passport.serializeUser((user: IUser, done: any) => {
        //     // @ts-ignore
        //   done(undefined, user._id);
        // });

        // Login a user locally
        const LocalStrategy = passportLocal.Strategy;
        passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
            (async (email, password, done) => {
                
                const returnUser = {
                    email: "user@test.test",
                    fullName: "user.fullName",
                    // @ts-ignore
                    _id: "user._id"
                };
                return done(null, returnUser, {
                    message: 'Logged In Successfully'
                });
            })
        ));
    }
}
