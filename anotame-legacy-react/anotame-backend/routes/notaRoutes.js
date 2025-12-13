import express from 'express';
import NotaController from '../controllers/notaController.js';

const router = express.Router();

router.post('/', NotaController.create);
router.get('/:id', NotaController.getById);
router.get('/client/:clientId', NotaController.getByClient);
// Add PUT, DELETE, etc.

export default router;