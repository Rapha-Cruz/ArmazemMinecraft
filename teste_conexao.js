require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('Conexão OK!');
    return client.end();
  })
  .catch(err => {
    console.error('Erro na conexão:', err);
    client.end();
  });