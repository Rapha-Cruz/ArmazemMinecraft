const express = require('express');
const router = express.Router();
const bd = require('../conexao');

router.get('/', async (req, res) => {
    try {

        const mensagem = req.query.mensagem;

              
        // Busca o total de produtos em estoque
        const resultProdutos = await bd.query('SELECT SUM(estoque) AS total_estoque FROM produtos');
        const totalEstoque = resultProdutos.rows[0].total_estoque || 0;

        // Busca o total de categorias
        const resultCategorias = await bd.query('SELECT COUNT(*) AS total_categorias FROM categorias');
        const totalCategorias = resultCategorias.rows[0].total_categorias || 0;

        // Busca a soma total dos preços dos produtos
        const resultSomaPrecos = await bd.query('SELECT SUM(valor * estoque) AS soma_total_precos FROM produtos');
        const somaTotalPrecos = Number(resultSomaPrecos.rows[0].soma_total_precos) || 0;

        // Busca o total de produtos com estoque mínimo menor que o estoque atual
        const resultEstoqueMinimo = await bd.query('SELECT COUNT(*) AS produtos_abaixo_minimo FROM produtos WHERE estoque < estoque_minimo');
        const produtosAbaixoMinimo = resultEstoqueMinimo.rows[0].produtos_abaixo_minimo || 0;

        // --- Consulta para o gráfico de Valor por Categoria ---
        const resultValorPorCategoria = await bd.query(`
            SELECT c.nome, SUM(p.valor * p.estoque) AS valor_total 
            FROM produtos p JOIN categorias c ON p.id_categoria = c.id_categoria GROUP BY c.nome
        `);
        const categoriasData = resultValorPorCategoria.rows.map(row => ({
            label: row.nome,
            value: row.valor_total || 0
        }));

        // --- Consulta para o gráfico de Estoque por Produto ---
        const resultEstoquePorProduto = await bd.query('SELECT nome, estoque FROM produtos ORDER BY estoque DESC LIMIT 5');
        const produtosData = resultEstoquePorProduto.rows.map(row => ({
            label: row.nome,
            value: row.estoque
        }));

        // --- Nova consulta para a tabela de produtos abaixo do estoque mínimo ---
        const resultProdutosAbaixoMinimo = await bd.query(`
            SELECT p.id_produto, p.nome AS nome_produto, p.estoque, p.estoque_minimo, p.valor, p.imagem, c.nome AS nome_categoria
            FROM produtos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.estoque < p.estoque_minimo
            ORDER BY p.estoque ASC
        `);
        const produtosAbaixoMinimoList = resultProdutosAbaixoMinimo.rows;
        
        // Cria um único objeto 'data' com todas as informações
        const data = {
            totalEstoque: totalEstoque,
            totalCategorias: totalCategorias,
            valorTotalEstoque: somaTotalPrecos.toFixed(2).replace('.', ','),
            produtosAbaixoMinimo: produtosAbaixoMinimo,
            categorias: {
                labels: categoriasData.map(item => item.label),
                values: categoriasData.map(item => item.value)
            },
            produtos: {
                labels: produtosData.map(item => item.label),
                values: produtosData.map(item => item.value)
            },
            produtosAbaixoMinimoList: produtosAbaixoMinimoList // Adiciona a nova lista de produtos
        };

        // Renderiza a página 'dashboard.ejs' e passa o objeto 'data'
        res.render('index', { mensagem, data });
    } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
        res.status(500).send('Erro ao carregar dados do painel.');
    }
});

module.exports = router;
