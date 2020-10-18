import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * Project attributes interface.
 */
export interface ProjectAttributes extends Attributes {
    [key: string]: string | Date | number | string[] | any;
    title: string;
    description: string;
    avatar: string;
    idAWS: number;
    idOwner: number;
    adminsList: string[];
    editorsList: string[];
    readersList: string[];
    filesList: string[];
    foldersList: string[];
}

/**
 * Project instance interface.
 */
export interface ProjectInstance extends ProjectAttributes, Document {}

/**
 * Creates the project model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<ProjectInstance> {
    return mongoose.model('Project', createProjectSchema(container), 'projects');
}

/**
 * Creates the project schema.
 * 
 * @param container Services container
 * @returns Project schema
 */
function createProjectSchema(container: ServiceContainer) {
    const schema = new Schema({
        title: {
            type: Schema.Types.String,
            required: [true, 'A title is required'],
        },
        description: {
            type: Schema.Types.String,
            required: [true, 'A description is required'],
        },
        avatar: {
            type: Schema.Types.String,
            required: [false, ''],
        },
        idAWS: {
            type: Schema.Types.Number,
            required: [false, ''],
        },
        idOwner: {
            type: Schema.Types.Number,
            required: [false, ''],
        },
        adminsList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        },
        editorsList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        },
        readersList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        },
        filesList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        },
        foldersList: {
          type: [{
            type: Schema.Types.String
          }],
            required: [false, ''],
        },
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    return schema;
}
