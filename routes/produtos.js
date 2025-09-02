const express = require('express');
const router = express.Router();
const bd = require('../conexao');

// Rota para exibir o formulário de cadastro de produto
router.get('/novo_produto', async (req, res) => {
    try {
        // Busca todas as categorias para preencher o select
        const resultado = await bd.query('SELECT id_categoria, nome FROM categorias');
        res.render('novo_produto', { categorias: resultado.rows });
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).send('Erro no servidor ao buscar produtos');
    }
});

// // Rota para cadastrar um novo produto
// router.post('/cadastro', async (req, res) => {
//     const { nome, estoque, estoque_minimo, valor, imagem, id_categoria } = req.body;
    
//     try {
//         // Insere o novo produto no banco de dados
//         await bd.query(
//             'INSERT INTO produtos (nome, estoque, estoque_minimo, valor, imagem, id_categoria) VALUES ($1, $2, $3, $4, $5, $6)',
//             [nome, estoque, estoque_minimo, valor, imagem, id_categoria]
//         );

//         const mensagem = 'Produto criado com sucesso!';
//         res.redirect(`/produtos/listar?mensagem=${mensagem}`);
        
//     } catch (err) {
//     console.error('Erro ao cadastrar produto:', err);
//     res.status(500).send('Erro no servidor ao cadastrar produto');
//     }
// });
// Rota para cadastrar um novo produto e criar movimentação de entrada automaticamente
router.post('/cadastro', async (req, res) => {
    const { nome, estoque, estoque_minimo, valor, imagem, id_categoria } = req.body;

    try {
        // Insere o novo produto no banco de dados e retorna o id do produto inserido
        const resultadoProduto = await bd.query(
            `INSERT INTO produtos (nome, estoque, estoque_minimo, valor, imagem, id_categoria)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_produto`,
            [nome, estoque, estoque_minimo, valor, imagem, id_categoria]
        );

        const id_produto = resultadoProduto.rows[0].id_produto;

        // Cria a movimentação de entrada automaticamente
        const usuarioId = req.session.user ? req.session.user.id_usuario : null; // usuário logado
        if (!usuarioId) {
            return res.status(401).send('Usuário não autenticado.');
        }

        const dataAtual = new Date(); // data da movimentação
        const queryMovimentacao = `
            INSERT INTO movimentacoes (tipo_movimentacao, data_movimentacao, quantidade, descricao, id_produto, id_usuario)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const valoresMovimentacao = [
            'Entrada',          // tipo de movimentação
            dataAtual,          // data da movimentação
            estoque,            // quantidade igual ao estoque inicial
            'Entrada de produto novo', // descrição
            id_produto,         // id do produto inserido
            usuarioId           // id do usuário que cadastrou
        ];
        await bd.query(queryMovimentacao, valoresMovimentacao);

        const mensagem = 'Produto criado com sucesso e movimentação de entrada registrada!';
        res.redirect(`/produtos/listar?mensagem=${mensagem}`);
        
    } catch (err) {
        console.error('Erro ao cadastrar produto e criar movimentação:', err);
        res.status(500).send('Erro no servidor ao cadastrar produto e registrar movimentação');
    }
})

// Rota para listar os produtos
router.get('/listar', async (req, res) => {
    try { 

        // if (!req.session.user || !req.session.user.usuario) {
        //     const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
        //     return res.redirect(`/usuarios/login?mensagem=${mensagem}`);
        // }
            
        const mensagem = req.query.mensagem;
        // Consulta para buscar todos os produtos e suas categorias
        const resultado = await bd.query(`
            SELECT produtos.id_produto, 
            produtos.nome AS nome_produto, 
            produtos.estoque, produtos.estoque_minimo, 
            produtos.valor, produtos.imagem, 
            categorias.nome AS nome_categoria
            FROM produtos
            JOIN categorias ON produtos.id_categoria = categorias.id_categoria
        `);
    
        // Renderiza uma página HTML ou envia os dados
        res.render('produto', {
            produtos: resultado.rows,
            mensagem: mensagem
        }); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar produtos');
    }
});

    //rota para a pesquisa de produtos
router.post('/pesquisar', async (req, res) => {
    try {
        const { pesquisa } = req.body;
        
        // Consulta ao banco de dados com filtro usando ILIKE 
        const resultado = await bd.query(
            `
            SELECT 
            produtos.id_produto, produtos.nome AS nome_produto, 
            produtos.estoque, produtos.estoque_minimo, 
            produtos.valor, produtos.imagem, categorias.nome AS nome_categoria
            FROM produtos
            JOIN categorias ON produtos.id_categoria = categorias.id_categoria
            WHERE produtos.nome ILIKE $1`,
            [`%${pesquisa}%`]
        );
        
        res.render('produto', {
            produtos: resultado.rows,
            mensagem: ""
        });
    } catch (err) {
    res.status(500).send('Erro no servidor ao listar produtos');
    }
});

// Rota para abrir a página de alteração de um produto específico
router.get('/alterar/:id_produto', async (req, res) => {
    const { id_produto } = req.params;
    
    try {
        // Consulta o produto e o nome da categoria associada
        const produtoResultado = await bd.query(
        `
            SELECT 
            produtos.id_produto, 
            produtos.nome AS nome_produto, 
            produtos.estoque, 
            produtos.estoque_minimo, 
            produtos.valor, 
            produtos.imagem, 
            produtos.id_categoria, 
            categorias.nome AS nome_categoria
            FROM produtos
            JOIN categorias ON produtos.id_categoria = categorias.id_categoria
            WHERE produtos.id_produto = $1
            `,
            [id_produto]
        );

        // Consulta todas as categorias para o selection box
        const categoriasResultado = await bd.query('SELECT id_categoria, nome FROM categorias');
            
        // Verifica se o produto foi encontrado
        if (produtoResultado.rows.length > 0) {
            res.render('alterar_produto', {
                produto: produtoResultado.rows[0],
                categorias: categoriasResultado.rows
            });
        } else {
            res.status(404).send('Produto não encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao abrir a página de alteração');
    }
});

// Rota para processar a alteração de um produto
router.post('/alterar/:id_produto', async (req, res) => {
    const { id_produto } = req.params;
    const { nome_produto, estoque, estoque_minimo, valor, id_categoria, imagem } = req.body;
    // console.log(nome_produto)
    // console.log("Dados recebidos:", { nome_produto, estoque, estoque_minimo, valor, id_categoria, imagem })
    
    try {
        // Atualiza o produto com o novo nome
        query = `UPDATE produtos SET 
            nome = $1,
            estoque = $2,
            estoque_minimo = $3,
            valor = $4,
            id_categoria = $5,
            imagem = $6
            WHERE id_produto = $7
        `;
        const valores = [nome_produto, estoque, estoque_minimo, valor, id_categoria, imagem, id_produto];
        await bd.query(query, valores);
        
        // Define a mensagem de sucesso em uma variável
        const mensagem = 'Produto alterado com sucesso!';    
        res.redirect(`/produtos/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao alterar produto');
    }
});

// Rota para excluir um produto usando POST
router.post('/excluir/:id_produto', async (req, res) => {
    const { id_produto } = req.params;
    
    try {
        // Executa a query para excluir a categoria pelo ID
        await bd.query('DELETE FROM produtos WHERE id_produto = $1', [id_produto]);
    
        const mensagem = 'Produto excluído com sucesso!';
        res.redirect(`/produtos/listar?mensagem=${mensagem}`);
    } catch (err) {
        console.error('Erro ao excluir produto:', err);
        res.status(500).send('Erro no servidor ao excluir produto');
    }
});

module.exports = router;

    
    