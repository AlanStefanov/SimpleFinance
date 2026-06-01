import { Router } from 'express';
import * as controller from '../controllers/paymentsController.js';

const router = Router();
router.get('/', controller.getAll);
router.get('/current', controller.getCurrentMonth);
router.post('/', controller.create);
router.post('/generate', controller.generateMonth);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

export default router;
