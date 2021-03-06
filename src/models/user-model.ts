import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import bcrypt from 'bcryptjs';

/**
 * User attributes interface.
 */
export interface UserAttributes extends Attributes {
    login: string;
    password: string;
    email: string;
    avatar: string;
    isAdmin: boolean;
    lastLog: string; // ou number si unixtime?? idk
    stars: string[];
    darkmode: boolean;
    refreshToken?: string;
}

/**
 * User instance interface.
 */
export interface UserInstance extends UserAttributes, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<UserInstance> {
    return mongoose.model('User', createUserSchema(container), 'users');
}

/**
 * Creates the user schema.
 * 
 * @param container Services container
 * @returns User schema
 */
function createUserSchema(container: ServiceContainer) {
    const schema = new Schema({
        login: {
            type: Schema.Types.String,
            required: [true, 'Login is required'],
            unique: [true, 'Login already exists']
        },
        password: {
            type: Schema.Types.String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password is too small: it must be at least 8 characters'],
            select: false
        },
        email: {
            type: Schema.Types.String,
            required: [true, 'Email is required'],
            minlength: [8, 'Email is too small: it must be at least 8 characters'],
            unique: [true, 'Email already used']
        },
        avatar: {
            type: Schema.Types.String
        },
        isAdmin: {
            type: Schema.Types.Boolean,
            default: false
        },
        lastLog: {
            type: Schema.Types.Date,
            default: Date.now
        },
        stars: {
            type: Schema.Types.Array
        },
        darkmode: {
            type: Schema.Types.Boolean,
            default: false
        },
        refreshToken: {
            type: Schema.Types.String,
            default: null,
            select: false
        }
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    // Password hash validation
    schema.pre('save', async function(this: UserInstance, next) {
        if ((this.isNew) && (this.password != null)) { // Validates the password only if filled
            try {
                this.password = await container.crypto.hash(this.password, parseInt(process.env.HASH_SALT, 10));
                return next();
            } catch (err) {
                return next(err);
            }
        }
    });

    schema.method('comparePassword', async function (candidatePassword: string, userPassword : string){
        const passMatch = await container.crypto.compare(candidatePassword, userPassword);
        if (passMatch) { return true; }    
        else { return false; }
    });

    return schema;
}
