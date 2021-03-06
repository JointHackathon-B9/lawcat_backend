import { Router } from 'express';
import IndexController from '@controllers/index.controller';
import { Routes } from '@interfaces/routes.interface';

class IndexRoute implements Routes {
  public path = '/';
  public router = Router();
  public indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signIn`, this.indexController.signIn);
    this.router.post(`${this.path}hook`, this.indexController.hook);
    this.router.post(`${this.path}bot`, this.indexController.createBotChannel);
    this.router.post(`${this.path}lawyerChat`, this.indexController.addLawyerAndReleaseBot);
    this.router.post(`${this.path}lawyer`, this.indexController.addLawyer);
    this.router.delete(`${this.path}channel/:id`, this.indexController.deleteChannel);
    this.router.post(`${this.path}complete`, this.indexController.aiCompleteHook);
  }
}

export default IndexRoute;
