import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';
import bcrypt from 'bcryptjs';

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
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.login });
    }

    public async login (req: Request, res: Response): Promise<any> {

        //Check if login and password are set
        let { login, password, email } = req.body;
        if (!( ( login || email ) && password) ) {
          res.status(400).send();
        }
    
        //Get user from database
        try {
            let user;
            if( login ){
              user = await this.db.users.findOne( { 'login' : login } ).select('+password').exec( function(err: Error, user){
                if(err || !user ) { 
                  return res.status(404).send({
                      error: 'not_found',
                      error_description: 'User not found'
                  });
                } else {
                  user.schema.methods.comparePassword( password, user.password, function (error: Error, isMatch: boolean) {
                    if (error) { 
                      return res.status(404).send({
                          error: 'wrong_password',
                          error_description: 'Wrong password'
                      });
                    } else if(isMatch) {
                      return res.status(200).send({ user });
                    }
                  })
                }
              });
            } else if ( email ){
              user = await this.db.users.findOne( { 'email' : email } ).select('+password').exec( function(err: Error, user){
                if(err || !user ) { 
                  return res.status(404).send({
                      error: 'not_found',
                      error_description: 'User not found'
                  });
                } else {
                  
                  const isMatch = user.schema.methods.comparePassword( password, user.password );
                  
                  console.log( password, user.password );
                  console.log( user.schema.methods.comparePassword( password, user.password ) );
                    if (!isMatch) { 
                      return res.status(404).send({
                          error: 'wrong_password',
                          error_description: 'Wrong password'
                      });
                    } else if(isMatch) {
                      return res.status(200).send({ user });
                    }
                  
                }
              });
            }

        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    
        /*
        
        //Sing JWT, valid for 1 hour
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          config.jwtSecret,
          { expiresIn: "1h" }
        );
    
        //Send the jwt in the response
        res.send(token);

        */
      };
    
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
