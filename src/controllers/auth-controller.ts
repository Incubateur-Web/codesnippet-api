import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';
import jwt = require('jsonwebtoken');
import TokenService, { TokenData } from '../services/token-service';

/**
 * Authentification class.
 * 
 * Root path : `/auth`
 * @param container Services container
 */
export default class AuthController extends Controller  {

    public constructor(container: ServiceContainer) {
        super(container, '/auth');
        this.login = this.login.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.verifyToken = this.verifyToken.bind(this);
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.login });
        this.registerEndpoint({ method: 'POST', uri: '/refresh', handlers: this.refreshToken });
        this.registerEndpoint({ method: 'POST', uri: '/verify', handlers: this.verifyToken });
    }

    public async login (req: Request, res: Response): Promise<any> {

        // On vérifie qu'un login (pseudo ou mail) et qu'un mdp sont renseignés
        let { login, password, email } = req.body;
        if (!( ( login || email ) && password) ) {
          res.status(400).send();
        }
    
        // Si on récupère les infos nécessaires à la connexion, on initie une query
        try {
            let query;
            let tokenService = this.container.tokens;

            // FIX Il y a peut-être moyen de faire ça mieux mais pour l'instant ça marche
            if( login ) query = this.db.users.findOne( { 'login' : login } );
            if( email ) query = this.db.users.findOne( { 'email' : email } );

            if( query ) {
              // On récupère l'user avec MDP pour pouvoir le comparer après
              await query.select('+password').exec( function(err: Error, user){
                // Si l'utilisateur n'existe pas dans la BDD : 
                if(err || !user ) { 
                  return res.status(404).send({
                      error: 'not_found',
                      error_description: 'User not found'
                  });
                } 
                // Si un utilisateur est trouvé dans la BDD
                else {
                  // On compare le mdp stocké et celui envoyé par le client
                  const isMatch = user.schema.methods.comparePassword( password, user.password );
                  if (!isMatch) { 
                    // Si les mdps ne correspondent pas
                    return res.status(404).send({
                        error: 'wrong_password',
                        error_description: 'Wrong password'
                    });
                  } 
                  // Si les mdps correspondent
                  else if(isMatch) {
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
                      return res.status(200).header('Authorization', token).send({ token });
                    }); 
                    // Pas de gestion d'erreur si la fonction renvoit rien ? 
                  }
                  
                }
              });
            }

        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }

      };

      public async refreshToken (req: Request, res: Response): Promise<any> {

      }

      public async verifyToken (req: Request, res: Response): Promise<any> {
      
        let tokenService = this.container.tokens;
        const token = req.header('Authorization');

        if( !token ) return res.status(401).send('Access Denied');

        try{
          tokenService.decode( token , process.env.TOKEN_SECRET).then( verified => {
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
