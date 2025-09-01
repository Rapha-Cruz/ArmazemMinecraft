const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const bd = require('../conexao');; // Importa a conexão com o banco

// Rota para a página de cadastro (HTML)
router.get('/login', (req, res) => {
    const mensagem = req.query.mensagem || ''; 
    res.render('login', { mensagem: mensagem });
});
    
// Rota para processar o login (assumindo que o formulário envia dados JSON)
router.post('/login', async (req, res) => {
    const { usuario, senha } = req.body; // Desestruturação do objeto JSON enviado

    try {
        const resultado = await bd.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        const usuarioSel = resultado.rows[0];
        // console.log(usuarioSel.id_usuario);
        // console.log(req.session.user);
        
        if (usuarioSel && await bcrypt.compareSync(senha, usuarioSel.senha)) {
            req.session.user = {
                id_usuario: usuarioSel.id_usuario,
                usuario: usuarioSel.usuario
            };                
            // res.status(200).render('index', { mensagem: 'Login efetuado com sucesso!' });
            res.status(200).redirect('/');
        } else {
            res.status(401).render('login', { mensagem: 'Usuário ou senha inválidos' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

    // Rota para a página de cadastro (HTML)
router.get('/novo_usuario', (req, res) => {
     res.render('novo_usuario');
});
    
// Rota para processar o cadastro
router.post('/cadastro', async (req, res) => {
    const { usuario, nome, senha } = req.body;
    
    // Criptografar a senha antes de salvar no banco de dados
    const saltRounds = 10; // Número de rodadas de hash
    const senhaCripto = await bcrypt.hash(senha, saltRounds);
       
    try {
        // Inserir o novo usuário no banco de dados
        const resultado = await bd.query('INSERT INTO usuarios (usuario, nome, senha) VALUES ($1, $2, $3)', [usuario, nome, senhaCripto]);
        console.log('Usuário criado:', resultado.rows[0]); // esse log vai aparecer no Vercel
        res.render('login', { mensagem: 'Usuário criado com sucesso!!!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar usuário');
    }
});

module.exports = router; // Exportando o router para ser usado em outros arquivos
