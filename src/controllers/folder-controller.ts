import { Request, Response } from 'express';
import { FolderInstance } from '../models/folder-model';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Folders controller class.
 * 
 * Root path : `/folders`
 */
export default class FolderController extends Controller {

    /**
     * Creates a new folders controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/folders');
        this.listHandler = this.listHandler.bind(this);
        this.getHandler = this.getHandler.bind(this);
        this.createHandler = this.createHandler.bind(this);
        this.modifyHandler = this.modifyHandler.bind(this);
        this.updateHandler = this.updateHandler.bind(this);
        this.deleteHandler = this.deleteHandler.bind(this);
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: this.modifyHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: this.updateHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    }

    /**
     * Lists all folders.
     * 
     * Path : `GET /folders`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<any> {
        try {
            return res.status(200).send({ folders: await this.db.folders.find() });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific folder.
     * 
     * Path : `GET /folders/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getHandler(req: Request, res: Response): Promise<any> {
        try {
            const folder = await this.db.folders.findById(req.params.id).populate('applications');
            if (folder == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Folder not found'
                }));
            }
            return res.status(200).send({ folder });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new folder.
     * 
     * Path : `POST /folders`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<any> {
        try {
            const folder = await this.db.folders.create({
              title: req.body.title,
              filesList: req.body.filesList
            });
            return res.status(201).send({
                id: folder.id,
                links: [{
                    rel: 'Gets the created folder',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${folder.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Modifies an folder.
     * 
     * Path : `PUT /folders/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<any> {
        try {
            const folder = await this.db.folders.findById(req.params.id);
            if (folder == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Folder not found'
                }));
            }
            folder.title = req.body.title;
            folder.filesList = req.body.filesList;

            await folder.save();
            return res.status(200).send({
                id: folder.id,
                links: [{
                    rel: 'Gets the modified folder',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${folder.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Updates an folder.
     * 
     * Path : `PATCH /folders/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<any> {
        try {
            const folder = await this.db.folders.findById(req.params.id);
            if (folder == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Folder not found'
                }));
            }

            for (const [key, value] of Object.entries(req.body)){
                if (value != null) {
                    folder[key] = value;
                }
            }

            await folder.save();
            return res.status(200).send({
                id: folder.id,
                links: [{
                    rel: 'Gets the updated folder',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${folder.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Deletes an folder.
     * 
     * Path : `DELETE /folders/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<any> {
        try {
            const folder = await this.db.folders.findByIdAndDelete(req.params.id);
            if (folder == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Folder not found'
                }));
            }
            return res.status(204).send();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
