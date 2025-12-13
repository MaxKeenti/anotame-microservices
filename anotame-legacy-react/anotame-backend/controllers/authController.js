import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import EmpleadosModel from '../models/empleadosModel.js';

const AuthController = {
  async login(req, res) {
    try {
      const { Nombre, Contraseña } = req.body;
      const empleado = await EmpleadosModel.getByUsername(Nombre);
      
      if (!empleado) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(Contraseña, empleado.Contraseña);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: empleado.id, role: 'empleado' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

export default AuthController;