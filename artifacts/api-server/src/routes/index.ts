import { Router, type IRouter } from "express";
import healthRouter from "./health";
import produtosRouter from "./produtos";
import estoqueRouter from "./estoque";

const router: IRouter = Router();

router.use(healthRouter);
router.use(produtosRouter);
router.use(estoqueRouter);

export default router;
