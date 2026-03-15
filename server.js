const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/chat', require('./routes/chat'));
app.use('/api/characters', require('./routes/characters'));

app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  app: 'RolePlay AI',
  version: '1.0.0'
}));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
