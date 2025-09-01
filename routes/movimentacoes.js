const express = require('express');
const router = express.Router();
const bd = require('../conexao');

router.get('/listar', async (req, res) => {
    try {        
        const mensagem = req.query.mensagem;
        // if (!req.session.user || !req.session.user.usuario) {
        //     const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
        //     return res.redirect(`/usuarios/login?mensagem=${mensagem}`);
        // }

        const query = `
        SELECT movimentacoes.id_movimentacao, movimentacoes.tipo_movimentacao, 
        movimentacoes.data_movimentacao, movimentacoes.quantidade, 
        movimentacoes.descricao, produtos.nome AS nome_produto, 
        usuarios.usuario AS nome_usuario
        FROM movimentacoes
        JOIN produtos ON movimentacoes.id_produto = produtos.id_produto
        JOIN usuarios ON movimentacoes.id_usuario = usuarios.id_usuario
        ORDER BY movimentacoes.data_movimentacao DESC
        `;
        const resultado = await bd.query(query);
        res.render('movimentacao', {
            movimentacoes: resultado.rows,
            mensagem: mensagem
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar movimentações');
    }
});

// Rota para a página de cadastro 
router.get('/nova_movimentacao', async (req, res) => {
    try {
        // Busca produtos
        const produtos = await bd.query('SELECT id_produto, nome FROM produtos');
        
        // Busca usuários
        const usuarios = await bd.query('SELECT id_usuario, usuario AS nome_usuario FROM usuarios');
        
        // Renderiza a página de cadastro com as listas
        res.render('nova_movimentacao', {
            produtos: produtos.rows,
            usuarios: usuarios.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar página de cadastro de movimentação');
    }
})

router.post('/cadastro', async (req, res) => {
    const { tipo_movimentacao, data_movimentacao, quantidade, descricao, id_produto, id_usuario } = req.body;
    
    try {
        // Valida se todos os campos obrigatórios estão preenchidos
        if (!tipo_movimentacao || !data_movimentacao || !quantidade || !id_produto || !id_usuario) {
            return res.status(400).send('Por favor, preencha todos os campos obrigatórios.');
        }
        const query = `
            INSERT INTO movimentacoes (tipo_movimentacao, data_movimentacao, quantidade, descricao, id_produto, id_usuario) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const valores = [tipo_movimentacao, data_movimentacao, quantidade, descricao || null, id_produto, id_usuario];
        await bd.query(query, valores);

        // Atualiza o estoque do produto
        let queryAtualizacaoEstoque;
        if (tipo_movimentacao === 'Entrada') {
            // Se for uma entrada, adiciona a quantidade ao estoque
            queryAtualizacaoEstoque = 'UPDATE produtos SET estoque = estoque + $1 WHERE id_produto = $2';
        } else if (tipo_movimentacao === 'Saída') {
            // Se for uma saída, subtrai a quantidade do estoque
            queryAtualizacaoEstoque = 'UPDATE produtos SET estoque = estoque - $1 WHERE id_produto = $2';
        } else {
            return res.status(400).send('Tipo de movimentação inválido.');
        }

        await bd.query(queryAtualizacaoEstoque, [quantidade, id_produto]);
        ///////////
        
        const mensagem = 'Movimentação cadastrada com sucesso!';
        res.redirect(`/movimentacoes/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error('Erro ao cadastrar movimentação:', err);
        res.status(500).send('Erro no servidor ao cadastrar movimentação.');
    }
});

router.get('/listar_estoque', async (req, res) => {
    try {
        // if (!req.session.user || !req.session.user.usuario) {
        //     const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
        //     return res.redirect(`/usuarios/login?mensagem=${mensagem}`);
        // }

        const query = `
            SELECT p.id_produto, p.nome, p.estoque
            FROM produtos as p
            ORDER BY p.id_produto, p.nome;
        `;
        const resultado = await bd.query(query);
        if (resultado.rows.length > 0) {
            res.render('estoque', {
            produtos: resultado.rows,
            mensagem: ''    
            });
        } else {
            res.render('estoque',  {
                produtos: [],
                mensagem: 'Nenhum produto encontrado ou sem movimentações registradas.'
            });
        }
    } catch (err) {
        console.error('Erro ao listar estoque de todos os produtos:', err);
        res.status(500).send('Erro no servidor ao listar movimentação.');
    }
});
            
//rota para a pesquisa de movimentações
router.post('/pesquisar_estoque', async (req, res) => {
    try {
        const { pesquisa } = req.body;
        const query = `
            SELECT p.id_produto, p.nome,
            COALESCE(SUM(CASE 
            WHEN m.tipo_movimentacao = 'Entrada' THEN m.quantidade
            WHEN m.tipo_movimentacao = 'Saída' THEN -m.quantidade
            ELSE 0
            END), 0) AS estoque
            FROM produtos p
            LEFT JOIN movimentacoes m ON p.id_produto = m.id_produto
            WHERE p.nome ILIKE $1
            GROUP BY p.id_produto, p.nome;  
        `;
    
        const valores = [`%${pesquisa}%`];  
    
        const resultado = await bd.query(query, valores);
    
        // Renderiza a página de listagem com os dados retornados
        res.render('estoque', { produtos: resultado.rows, mensagem: "" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar movimentações');
    }
});

//rota para a pesquisa de movimentações
router.post('/pesquisar', async (req, res) => {
    try {
        const { pesquisa } = req.body;
        const query = `
            SELECT 
            movimentacoes.id_movimentacao, movimentacoes.tipo_movimentacao, 
            movimentacoes.data_movimentacao, movimentacoes.quantidade, 
            movimentacoes.descricao, produtos.nome AS nome_produto, 
            usuarios.usuario AS nome_usuario
            FROM movimentacoes
            JOIN produtos ON movimentacoes.id_produto = produtos.id_produto
            JOIN usuarios ON movimentacoes.id_usuario = usuarios.id_usuario
            WHERE produtos.nome ILIKE $1 OR movimentacoes.descricao ILIKE $1
            ORDER BY movimentacoes.data_movimentacao DESC
        `;
        const valores = [`%${pesquisa}%`]; 
        const resultado = await bd.query(query, valores);
        res.render('movimentacao', {
            movimentacoes: resultado.rows,
            mensagem: ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar movimentações');
    }
});
    
module.exports = router;
        