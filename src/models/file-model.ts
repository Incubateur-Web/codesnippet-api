import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * File attributes interface.
 */
export interface FileAttributes extends Attributes {
    [key: string]: string | Date | number | string[] | any;
    title: string;
    mimeType: string;
    extension: string;
    idOwner: string;
}

/**
 * File instance interface.
 */
export interface FileInstance extends FileAttributes, Document {}

/**
 * Creates the File model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<FileInstance> {
    return mongoose.model('File', createFileSchema(container), 'files');
}

/**
 * Creates the File schema.
 * 
 * @param container Services container
 * @returns File schema
 */
function createFileSchema(container: ServiceContainer) {
    const schema = new Schema({
        title: {
            type: Schema.Types.String,
            required: [true, 'A title is required'],
        },
        mimeType: {
            type: Schema.Types.String,
            required: [true, 'A mimeType is required'],
        },
        extension: {
            type: Schema.Types.String,
            required: [true, 'An extension is required'],
        },
        idOwner: {
            type: Schema.Types.String,
            required: [true, 'An idOwner is required'],
        },
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    return schema;
}
