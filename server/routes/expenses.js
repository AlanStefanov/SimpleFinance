import { Router } from 'express';
import * as controller from '../controllers/expensesController.js';

const router = Router();
router.get('/', controller.getAll);
router.get('/summary', controller.getSummary);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
