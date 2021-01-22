import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';
import jwt = require('jsonwebtoken');
import TokenService, { AccessTokenData, RefreshTokenData, TokenData } from '../services/token-service';
/**
 * Authentification class.
 * 
 * Root path : `/auth`
 * @param container Services container
 */
export default class AuthController extends Controller {

  public constructor(container: ServiceContainer) {
    super(container, '/auth');
    this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.login });
    this.registerEndpoint({ method: 'POST', uri: '/access', handlers: this.accessToken });
    this.registerEndpoint({ method: 'POST', uri: '/refresh', handlers: this.refreshToken });
    this.registerEndpoint({ method: 'POST', uri: '/verify', handlers: this.verifyToken });
  }

  public async login(req: Request, res: Response): Promise<any> {

    // On vérifie qu'un login (pseudo ou mail) et qu'un mdp sont renseignés
    const { login, password, email } = req.body;
    if (!((login || email) && password)) {
      res.status(400).send();
    }

    // Si on récupère les infos nécessaires à la connexion, on initie une query
    try {
      let query;
      const tokenService = this.container.tokens;

      // FIX Il y a peut-être moyen de faire ça mieux mais pour l'instant ça marche
      if (login) query = this.db.users.findOne({ 'login': login });
      if (email) query = this.db.users.findOne({ 'email': email });

      if (query) {
        // On récupère l'user avec MDP pour pouvoir le comparer après
        await query.select('+password').exec(function (err: Error, user) {
          // Si l'utilisateur n'existe pas dans la BDD : 
          if (err || !user) {
            return res.status(404).send({
              error: 'not_found',
              error_description: 'User not found'
            });
          }
          // Si un utilisateur est trouvé dans la BDD
          else {
            // On compare le mdp stocké et celui envoyé par le client
            user.schema.methods.comparePassword(password, user.password).then( (isMatch: boolean) => {
              console.log(password, user.password);
              if (!isMatch) {
                // Si les mdps ne correspondent pas
                return res.status(404).send({
                  error: 'wrong_password',
                  error_description: 'Wrong password'
                });
              }
              // Si les mdps correspondent
              else if (isMatch) {
                // Data à stocker dans le token
                const data = {// Identifiant de l'utilisateur
                  userId: user.id // Username de l'utilisateur (je pense qu'on pourrait s'en passer)
                };

                // Création du token 
                // tokenService.encode(
                //   data,
                //   process.env.ACCESS_TOKEN_KEY, // Clé secrete pour encode le token : ACCESS_TOKEN_KEY == doublon d'une autre variable env ? 
                //   { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRATION, 10) } // Date d'expiration du token, au delà duquel il faudra se reco
                // ).then(token => {
                //   // On envoit le token au client
                //   return res.status(200).header('Authorization', token).send({ 'token': token, 'username': user.login });
                // });

                return res.status(200).json(data);
              }
            });
          }
        });
      }

    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }

  }

  /**
     * Gets a new access token with a refresh token.
     * 
     * Path: `POST /accessToken`
     * 
     * @param req Express request
     * @param res Express response
     */
    public async accessToken(req: Request, res: Response): Promise<Response> {
      try {
          const user = await this.db.users.findOne({ refreshToken: req.body.refresh_token });
          if (user == null) {
              return res.status(404).json(this.container.errors.formatErrors({
                  error: 'access_denied',
                  error_description: 'Invalid refresh token'
              }));
          }
          const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: user.id }, process.env.ACCESS_TOKEN_KEY, {
              expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRATION, 10)
          });
          return res.status(200).json({ access_token: accessToken });
      } catch (err) {
          return res.status(500).json(this.container.errors.formatServerError());
      }
  }

  public async refreshToken(req: Request, res: Response): Promise<any> {
    try {
      const user = await this.db.users.findOne({ email: req.body.email }).select('+password');
      if (user == null) {
        return res.status(404).json(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found with this email'
        }));
      }
      if (req.body.password == null || !await this.container.crypto.compare(req.body.password, user.password)) {
        return res.status(401).json(this.container.errors.formatErrors({
          error: 'access_denied',
          error_description: 'Incorrect password'
        }));
      }
      const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: user.id }, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRATION, 10)
      });
      const refreshToken = await this.container.tokens.encode<RefreshTokenData>({ userId: user.id }, process.env.REFRESH_TOKEN_KEY, {
        expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRATION, 10)
      });
      user.refreshToken = refreshToken;
      await user.save();
      return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
    } catch (err) {
      console.log(err);
      return res.status(500).json(this.container.errors.formatServerError());
    }
  }

  public async verifyToken(req: Request, res: Response): Promise<any> {

    const tokenService = this.container.tokens;
    const token = req.header('Authorization');

    if (!token) return res.status(401).send('Access Denied');

    try {
      tokenService.decode(token, process.env.ACCESS_TOKEN_KEY).then(verified => {
        return res.status(200).send({ verified });
      });
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }

  /*
  static changePassword = async (req: Request, res: Response) => {
    //Get ID from JWT
    const id = res.locals.jwtPayload.userId;
 
    //Get parameters from the body
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send();
    }
 
    //Get user from the database
    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
    }
 
    //Check if old password matchs
    if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
      res.status(401).send();
      return;
    }
 
    //Validate de model (password lenght)
    user.password = newPassword;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }
    //Hash the new password and save
    user.hashPassword();
    userRepository.save(user);
 
    res.status(204).send();
  };
  */
}
