import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Files controller class.
 * 
 * Root path : `/files`
 */
export default class FileController extends Controller {

    /**
     * Creates a new files controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/files');
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: this.modifyHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: this.updateHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    }

    /**
     * Lists all files.
     * 
     * Path : `GET /files`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<Response> {
        try {
            return res.status(200).send({ files: await this.db.files.find() });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific file.
     * 
     * Path : `GET /files/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = await this.db.files.findById(req.params.id).populate('applications');
            if (file == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'File not found'
                }));
            }
            return res.status(200).send({ file });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new file.
     * 
     * Path : `POST /files`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = await this.db.files.create({
              title: req.body.title,
              mimeType: req.body.mimeType,
              extension: req.body.extension,
              idOwner: req.body.idOwner,
            });
            return res.status(201).send({
                id: file.id,
                links: [{
                    rel: 'Gets the created file',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${file.id}`
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
     * Modifies an file.
     * 
     * Path : `PUT /files/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = await this.db.files.findById(req.params.id);
            if (file == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'File not found'
                }));
            }
            file.title = req.body.title;
            file.mimeType = req.body.mimeType;
            file.extension = req.body.extension;
            file.idOwner = req.body.idOwner;

            await file.save();
            return res.status(200).send({
                id: file.id,
                links: [{
                    rel: 'Gets the modified file',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${file.id}`
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
     * Updates an file.
     * 
     * Path : `PATCH /files/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = await this.db.files.findById(req.params.id);
            if (file == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'File not found'
                }));
            }

            for (const [key, value] of Object.entries(req.body)){
                if (value != null) {
                    file[key] = value;
                }
            }

            await file.save();
            return res.status(200).send({
                id: file.id,
                links: [{
                    rel: 'Gets the updated file',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${file.id}`
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
     * Deletes an file.
     * 
     * Path : `DELETE /files/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = await this.db.files.findByIdAndDelete(req.params.id);
            if (file == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'File not found'
                }));
            }
            return res.status(204).send();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
