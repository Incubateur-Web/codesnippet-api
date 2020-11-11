import { Model, Mongoose } from 'mongoose';
import createRefreshTokenModel, { RefreshTokenInstance } from '../models/refresh-token-model';
import createUserModel, { UserInstance } from '../models/user-model';
import createProjectModel, { ProjectInstance } from '../models/project-model';
import createFileModel, { FileInstance } from '../models/file-model';
import createFolderModel, { FolderInstance } from '../models/folder-model';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Database service class.
 * 
 * This service is used to interact with database(s). Models must be registered in this service.
 */
export default class DatabaseService extends Service {

    public readonly users: Model<UserInstance>;
    public readonly projects: Model<ProjectInstance>;
    public readonly files: Model<FileInstance>;
    public readonly folders: Model<FolderInstance>;
    public readonly refreshTokens: Model<RefreshTokenInstance>;
    private readonly mongoose: Mongoose;

    /**
     * Creates a new database service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
        this.mongoose = this.createMongoose();
        this.users = createUserModel(container, this.mongoose);
        this.projects = createProjectModel(container, this.mongoose);
        this.files = createFileModel(container, this.mongoose);
        this.folders = createFolderModel(container, this.mongoose);
        this.refreshTokens = createRefreshTokenModel(container, this.mongoose);
    }

    /**
     * Connects to a database.
     * 
     * @param host Host
     * @param port Port
     * @param dbName Database name
     * @async
     */
    public async connect(host: string, port: string | number, dbName: string): Promise<void> {
        await this.mongoose.connect(host, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }

    /**
     * Disconnects from a database.
     * 
     * @async
     */
    public async disconnect(): Promise<void> {
        await this.mongoose.disconnect();
    }

    /**
     * Creates Mongoose instance.
     * 
     * @returns Mongoose instance
     */
    private createMongoose(): Mongoose {
        const mongoose = new Mongoose();
        mongoose.set('useCreateIndex', true);
        return mongoose;
    }
}
