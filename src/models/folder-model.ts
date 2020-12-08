import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * Folder attributes interface.
 */
export interface FolderAttributes extends Attributes {
    [key: string]: string | Date | number | string[] | unknown;
    title: string;
    filesList: string[]
}

/**
 * Folder instance interface.
 */
export interface FolderInstance extends FolderAttributes, Document {}

/**
 * Creates the Folder model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<FolderInstance> {
    return mongoose.model('Folder', createFolderSchema(), 'folders');
}

/**
 * Creates the Folder schema.
 * 
 * @returns Folder schema
 */
function createFolderSchema() {
    const schema = new Schema({
        title: {
            type: Schema.Types.String,
            required: [true, 'A title is required'],
        },
        filesList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        }
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    return schema;
}
