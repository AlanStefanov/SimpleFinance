import { Router } from 'express';
import * as controller from '../controllers/cardsController.js';

const router = Router();

router.get('/', controller.getAllCards);
router.get('/summaries', controller.getSummaries);
router.get('/:id', controller.getCardById);
router.post('/', controller.createCard);
router.put('/:id', controller.updateCard);
router.delete('/:id', controller.deleteCard);

router.get('/:id/expenses', controller.getCardExpenses);
router.post('/:id/expenses', controller.createCardExpense);
router.delete('/:id/expenses/:expenseId', controller.deleteCardExpense);

router.post('/summaries', controller.createSummary);
router.patch('/summaries/:id', controller.updateSummaryStatus);
router.delete('/summaries/:id', controller.deleteSummary);

export default router;
