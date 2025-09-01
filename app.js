// const express = require('express');
// const rota_usuario = require('./routes/usuarios'); 
// const rota_categoria = require('./routes/categorias');
// const rota_produto = require('./routes/produtos');
// const rota_movimentacao = require('./routes/movimentacoes');
// const rota_painel = require('./routes/painel');
// const expressLayouts = require('express-ejs-layouts'); 
// const session = require('express-session');

// const app = express();
// const port = 3000;

// // Defina o layout padrão 
// app.use(expressLayouts);
// app.set('layout', 'layouts/principal');

// app.set('view engine', 'ejs'); // Configurar o motor de templates EJS 
// app.use(express.static('public')); // Configurar pasta para arquivos estáticos 
// app.use(express.json()); // utilizar dados em formato JSON
// app.use(express.urlencoded({ extended: true })); // utilizar formulários

// // Configuração do middleware de sessão deve vir antes das rotas
// app.use(
//     session({
//         secret: '1234', // chave-secreta
//         resave: false, // Não salvar novamente a sessão se ela não foi modificada
//         saveUninitialized: false, // Não criar sessões vazias
//         cookie: { maxAge: 900000 } // Duração do cookie da sessão em milissegundos, no caso 15 minutos
//     })
// );

// // Middleware de autenticação para proteger as rotas
// const authMiddleware = (req, res, next) => {
//     // // --- LINHAS DE DEBUGGING ADICIONADAS ---
//     // console.log('Middleware de autenticação acionado para a rota:', req.path);
//     // console.log('Valor de req.session:', req.session);
//     // console.log('Valor de req.session.user:', req.session.user);
//     // ------------------------------------

//     // Verifica se a sessão e o usuário estão definidos
//     if (req.session && req.session.user) {
//         // console.log('Usuário autenticado. Prosseguindo para a próxima rota.');
//         next(); // Continua para a próxima rota se estiver autenticado
//     } else {
//         // Redireciona para a página de login se não estiver autenticado
//         // console.log('Usuário não autenticado. Redirecionando para login.');
//         const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
//         res.redirect(`/usuarios/login?mensagem=${mensagem}`);
//     }
// };

// // --- ROTAS PÚBLICAS (NÃO PRECISAM DE AUTENTICAÇÃO) ---
// // Rota principal: redireciona para o login ou painel.
// app.get('/', (req, res) => {
//     if (req.session.user) {
//         res.redirect('/painel');
//     } else {
//         res.redirect('/usuarios/login');
//     }
// });

// // Rotas de login e cadastro.
// app.use('/usuarios', rota_usuario);

// // Rota de logout.
// app.get('/logout', (req, res) => {
//     req.session.destroy(err => {
//         if (err) {
//             return res.send('Erro ao encerrar a sessão.');
//         }
//         res.redirect(`/usuarios/login`);
//     });
// });


// // --- ROTAS PROTEGIDAS (PRECISAM DE AUTENTICAÇÃO) ---
// // O middleware de autenticação é aplicado individualmente a cada rota protegida.
// app.use('/painel', authMiddleware, rota_painel);
// app.use('/categorias', authMiddleware, rota_categoria);
// app.use('/produtos', authMiddleware, rota_produto);
// app.use('/movimentacoes', authMiddleware, rota_movimentacao);


// // Rota antiga (comentada para não causar conflitos)
// // app.get('/', (req, res) => {
// //     res.render('index', { mensagem: '' });
// // });

// //servidor somente local na vercel nao roda
// // app.listen(port, () => {
// //     console.log(`Servidor executando em: http://localhost:${port}`);
// // });

// //incluir para rodar na vercel
// module.exports = app;



const express = require('express');
const path = require('path');
const rota_usuario = require('./routes/usuarios'); 
const rota_categoria = require('./routes/categorias');
const rota_produto = require('./routes/produtos');
const rota_movimentacao = require('./routes/movimentacoes');
const rota_painel = require('./routes/painel');
const expressLayouts = require('express-ejs-layouts'); 
const session = require('express-session');

const app = express();
const port = 3000;

// Defina o layout padrão 
app.use(expressLayouts);
app.set('layout', 'layouts/principal');

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(
    session({
        secret: '1234',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 900000 }
    })
);

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        const mensagem = encodeURIComponent('Você precisa estar logado para acessar esta página.');
        res.redirect(`/usuarios/login?mensagem=${mensagem}`);
    }
};

// Rotas públicas
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/painel');
    } else {
        res.redirect('/usuarios/login');
    }
});
app.use('/usuarios', rota_usuario);
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Erro ao encerrar a sessão.');
        }
        res.redirect(`/usuarios/login`);
    });
});

// Rotas protegidas
app.use('/painel', authMiddleware, rota_painel);
app.use('/categorias', authMiddleware, rota_categoria);
app.use('/produtos', authMiddleware, rota_produto);
app.use('/movimentacoes', authMiddleware, rota_movimentacao);

//servidor somente local na vercel nao roda
app.listen(port, () => {
    console.log(`Servidor executando em: http://localhost:${port}`);
});

// Exporta para a Vercel rodar
//module.exports = app;
