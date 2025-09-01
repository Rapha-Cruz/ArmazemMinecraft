require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: false
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