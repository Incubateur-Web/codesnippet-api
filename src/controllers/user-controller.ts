import { Request, Response } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';
import jwt = require('jsonwebtoken');
import TokenService, { TokenData } from '../services/token-service';

/**
 * Users controller class.
 * 
 * Root path : `/users`
 */
export default class UserController extends Controller {

    /**
     * Creates a new users controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/users');
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: this.modifyHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: this.updateHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    }

    /**
     * Lists all users.
     * 
     * Path : `GET /users`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<Response> {
        try {
            return res.status(200).send({ users: await this.db.users.find() });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific user.
     * 
     * Path : `GET /users/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id).populate('applications');
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(200).send({ user });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new user.
     * 
     * Path : `POST /users`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<any> {

        // On vérifie qu'un login (pseudo ou mail) et qu'un mdp sont renseignés
        const { login, password, email } = req.body;
        if (!login || !email || !password) {
          res.status(400).send();
        }
    
        // Si on récupère les infos nécessaires à la connexion, on initie une query
    
        const tokenService = this.container.tokens;

        this.db.users.findOne( {$or: [
            {login: login},
            {email: email}
        ]}).exec(async (err, user) =>{
            if( err ){
                return res.status(404).send({
                    error: 'not_found',
                    error_description: err
                });
            }
                // Pas d'utilisateur existant : on peut créer un compte
            if (!user) {
                try {
                    const user = await this.db.users.create({
                        login: req.body.login,
                        password: req.body.password,
                        email: req.body.email,
                        avatar: req.body.avatar
                    });
                    // Data à stocker dans le token
                    const data = { 
                        clientId : user._id, // Identifiant de l'utilisateur
                        username : user.login // Username de l'utilisateur (je pense qu'on pourrait s'en passer)
                    };
                    // Création du token 
                    tokenService.encode(
                        data, 
                        process.env.TOKEN_SECRET, // Clé secrete pour encode le token : TOKEN_SECRET == doublon d'une autre variable env ? 
                        { expiresIn: "1h" } // Date d'expiration du token, au delà duquel il faudra se reco
                    ).then( token => {
                        // On envoit le token au client
                        return res.status(201).header('Authorization', token).send({
                            id: user.id,
                            username: user.login,
                            token: token,
                        });
                    }); 
                    
                } catch (err) {
                    if (err.name === 'ValidationError') {
                        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
                    }
                    console.log(err);
                    return res.status(500).send(this.container.errors.formatServerError());
                }
            }
            else {
                return res.status(404).send({
                    error: 'not_found',
                    error_description: 'User found with those credentials'
                });
            }
        });
        
    }

    /**
     * Modifies an user.
     * 
     * Path : `PUT /users/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            user.login = req.body.login;
            user.password = req.body.password;
            await user.save();
            return res.status(200).send({
                id: user.id,
                links: [{
                    rel: 'Gets the modified user',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}`
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
     * Updates an user.
     * 
     * Path : `PATCH /users/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            if (req.body.login != null) {
                user.login = req.body.login;
            }
            if (req.body.password != null) {
                user.password = req.body.password;
            }
            await user.save();
            return res.status(200).send({
                id: user.id,
                links: [{
                    rel: 'Gets the updated user',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}`
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
     * Deletes an user.
     * 
     * Path : `DELETE /users/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findByIdAndDelete(req.params.id);
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(204).send();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
