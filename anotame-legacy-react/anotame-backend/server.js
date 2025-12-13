import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import notaRoutes from './routes/notaRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
// Import other routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/notas', notaRoutes);
app.use('/api/clientes', clienteRoutes);
// Add other routes

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});