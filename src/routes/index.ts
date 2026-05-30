import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { summaryController } from '../controllers/summaryController';
import { depositController } from '../controllers/depositController';

const router = Router();

router.get('/transactions', transactionController.getAllTransactions);
router.get('/transactions/type/:type', transactionController.getTransactionsByType);
router.get('/transactions/:id', transactionController.getTransactionById);
router.post('/transactions', transactionController.addTransaction);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);

router.get('/summary', summaryController.getBalanceSummary);
router.get('/health', summaryController.getHealthStatus);
router.get('/income-categories', summaryController.getIncomeCategories);
router.get('/expense-categories', summaryController.getExpenseCategories);
router.get('/fire', summaryController.getFireInfo);

router.get('/deposit-accounts', depositController.getAllAccounts);
router.get('/deposit-accounts/:id', depositController.getAccountById);
router.post('/deposit-accounts', depositController.addAccount);
router.put('/deposit-accounts/:id', depositController.updateAccount);
router.delete('/deposit-accounts/:id', depositController.deleteAccount);
router.get('/available-accounts', depositController.getAvailableAccounts);

export default router;