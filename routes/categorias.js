const express = require('express');
const router = express.Router();
const bd = require('../conexao');

//rota para a listagem de categorias
router.get('/listar', async (req, res) => {
    try {
        const mensagem = req.query.mensagem;
        // if (!req.session.user || !req.session.user.usuario) {
        //     const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
        //     return res.redirect(`/usuarios/login?mensagem=${mensagem}`);
        // }
        
        const resultado = await bd.query('SELECT id_categoria, nome FROM categorias');
        res.render('categoria', {
            categorias: resultado.rows,
            mensagem: mensagem
        });
    } catch (err) {
        res.status(500).send('Erro no servidor ao listar categorias');
    }
});

// Rota para acessar a página de nova categoria 
router.get('/nova_categoria', (req, res) => {
    res.render('nova_categoria');
});
    
// Rota para incluir a categoria no banco de dados
router.post('/cadastro', async (req, res) => {
    const { nome } = req.body;
    
    try {
        // Inserir o novo usuário no banco de dados
        await bd.query('INSERT INTO categorias (nome) VALUES ($1)', [nome]);
        
        // Define a mensagem
        const mensagem = 'Categoria criada com sucesso!';
        res.redirect(`/categorias/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar categoria');
    }
});

//rota para a pesquisa de categorias
router.post('/pesquisar', async (req, res) => {
    try {
        const { pesquisa } = req.body;
        
        // Consulta ao banco de dados com filtro usando ILIKE 
        const resultado = await bd.query(
            'SELECT id_categoria, nome FROM categorias WHERE nome ILIKE $1',
            [`%${pesquisa}%`]
        );
        
        // Renderiza a página com os resultados da pesquisa
        res.render('categoria', {
            categorias: resultado.rows,
            mensagem: ""
        });
        
    } catch (err) {
        res.status(500).send('Erro no servidor ao listar categorias');
    }
    
});
    
// Rota para abrir a página de alteração de uma categoria específica
router.get('/alterar/:id_categoria', async (req, res) => {
    const { id_categoria } = req.params;
    try {
        // Consulta a categoria pelo ID para exibir seus dados na página de alteração
        const resultado = await bd.query('SELECT * FROM categorias WHERE id_categoria = $1', [id_categoria]);
        
        // Verifica se a categoria foi encontrada
        if (resultado.rows.length > 0) {
            res.render('alterar_categoria', { categoria: resultado.rows[0] });
        } else {
            res.status(404).send('Categoria não encontrada');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao abrir a página de alteração');
    }
});

// Rota para incluir a alteração de uma categoria no banco de dados
router.post('/alterar/:id_categoria', async (req, res) => {
    const { id_categoria } = req.params;
    const { nome } = req.body;
    
    try {
        // Atualiza a categoria com o novo nome
        await bd.query('UPDATE categorias SET nome = $1 WHERE id_categoria = $2', [nome, id_categoria]);
        // Busca todas as categorias para exibir a lista atualizada
        const resultado = await bd.query('SELECT id_categoria, nome FROM categorias');
        const mensagem = 'Categoria alterada com sucesso!';
        res.redirect(`/categorias/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao alterar categoria');
    }
});

// Rota para excluir uma categoria usando POST
router.post('/excluir/:id_categoria', async (req, res) => {
    const { id_categoria } = req.params;
    
    try {
        // Executa a query para excluir a categoria pelo ID
        await bd.query('DELETE FROM categorias WHERE id_categoria = $1', [id_categoria]);
        
        // Define a mensagem de sucesso em uma variável
        const mensagem = 'Categoria excluída com sucesso!';
        
        res.redirect(`/categorias/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error('Erro ao excluir a categoria:', err);
        res.status(500).send('Erro no servidor ao excluir categoria');
    }
});   
 
module.exports = router;
