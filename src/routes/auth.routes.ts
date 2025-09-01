import express from 'express';
import { register, login } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);


export default AuthRouter;