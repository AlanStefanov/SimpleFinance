import { Router } from 'express';
import * as controller from '../controllers/transactionsController.js';

const router = Router();
router.get('/:id/transactions', controller.getByAccount);
router.post('/:id/transactions', controller.create);
router.delete('/:id/transactions/:txId', controller.remove);

export default router;
