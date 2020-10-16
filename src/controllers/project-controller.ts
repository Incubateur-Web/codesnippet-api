import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Projects controller class.
 * 
 * Root path : `/projects`
 */
export default class ProjectController extends Controller {

    /**
     * Creates a new projects controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/projects');
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
     * Lists all projects.
     * 
     * Path : `GET /projects`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<any> {
        try {
            return res.status(200).send({ projects: await this.db.projects.find() });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific project.
     * 
     * Path : `GET /projects/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getHandler(req: Request, res: Response): Promise<any> {
        try {
            const project = await this.db.projects.findById(req.params.id).populate('applications');
            if (project == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Project not found'
                }));
            }
            return res.status(200).send({ project });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new project.
     * 
     * Path : `POST /projects`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<any> {
        try {
            const project = await this.db.projects.create({
              title: req.body.title,
              description: req.body.description,
              avatar: req.body.avatar,
              idAWS: req.body.idAWS,
              idOwner: req.body.idOwner,
              adminsList: req.body.adminList,
              editorsList: req.body.editorsList,
              readersList: req.body.readersList,
              filesList: req.body.filesList,
              foldersList: req.body.foldersList
            });
            return res.status(201).send({
                id: project.id,
                links: [{
                    rel: 'Gets the created project',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${project.id}`
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
     * Modifies an project.
     * 
     * Path : `PUT /projects/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<any> {
        try {
            const project = await this.db.projects.findById(req.params.id);
            if (project == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Project not found'
                }));
            }
            project.title = req.body.title;
            project.description = req.body.description;
            project.avatar = req.body.avatar;
            project.idAWS = req.body.idAWS;
            project.idOwner = req.body.idOwner;
            project.adminsList = req.body.adminList;
            project.editorsList = req.body.editorsList;
            project.readersList = req.body.readersList;
            project.filesList = req.body.filesList;
            project.foldersList = req.body.foldersList;

            await project.save();
            return res.status(200).send({
                id: project.id,
                links: [{
                    rel: 'Gets the modified project',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${project.id}`
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
     * Updates an project.
     * 
     * Path : `PATCH /projects/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<any> {
        try {
            const project = await this.db.projects.findById(req.params.id);
            if (project == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Project not found'
                }));
            }
            if (req.body.title != null) {
                project.title = req.body.title;
            }
            if (req.body.description != null) {
                project.description = req.body.description;
            }
            if (req.body.avatar != null) {
                project.avatar = req.body.avatar;
            }
            if (req.body.idAWS != null) {
                project.idAWS = req.body.idAWS;
            }
            if (req.body.idOwner != null) {
                project.idOwner = req.body.idOwner;
            }
            if (req.body.adminsList != null) {
                project.adminsList = req.body.adminsList;
            }
            if (req.body.editorsList != null) {
                project.editorsList = req.body.editorsList;
            }
            if (req.body.readersList != null) {
                project.readersList = req.body.readersList;
            }
            if (req.body.filesList != null) {
                project.filesList = req.body.filesList;
            }
            if (req.body.foldersList != null) {
                project.foldersList = req.body.foldersList;
            }
            await project.save();
            return res.status(200).send({
                id: project.id,
                links: [{
                    rel: 'Gets the updated project',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${project.id}`
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
     * Deletes an project.
     * 
     * Path : `DELETE /projects/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<any> {
        try {
            const project = await this.db.projects.findByIdAndDelete(req.params.id);
            if (project == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Project not found'
                }));
            }
            return res.status(204).send();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
