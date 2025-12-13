import pool from '../config/db.js';

const NotaModel = {
  // Create a new note
  async create(notaData) {
    const [result] = await pool.execute(
      `INSERT INTO Nota (
        FechaEntrega, FechaRecibido, idEmpresa, Folio, 
        idClientes, Total, idEmpleado
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        notaData.FechaEntrega,
        notaData.FechaRecibido,
        notaData.idEmpresa,
        notaData.Folio,
        notaData.idClientes,
        notaData.Total,
        notaData.idEmpleado
      ]
    );
    return result.insertId;
  },

  // Get note by ID
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM Nota WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get notes by client
  async getByClient(clientId) {
    const [rows] = await pool.execute(
      `SELECT * FROM Nota WHERE idClientes = ?`,
      [clientId]
    );
    return rows;
  },

  // Other CRUD operations...
};

export default NotaModel;