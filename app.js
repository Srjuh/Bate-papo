const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

// Configuração do servidor
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'chat_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Dados em memória
let users = [];
let messages = [];

// Middleware para verificar login
const checkLogin = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    next();
};

// Rota inicial (login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        req.session.loggedIn = true;
        req.session.lastAccess = req.cookies.lastAccess || 'Primeiro acesso';
        res.cookie('lastAccess', new Date().toLocaleString());
        return res.redirect('/menu');
    }
    res.send(`<h1>Login inválido!</h1><a href="/">Voltar</a>`);
});

// Menu principal
app.get('/menu', checkLogin, (req, res) => {
    const lastAccess = req.session.lastAccess;
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Menu</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #6a11cb, #2575fc);
                    color: #fff;
                    text-align: center;
                }

                h1 {
                    margin-bottom: 20px;
                }

                p {
                    font-size: 16px;
                    margin-bottom: 20px;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                }

                ul li {
                    margin: 20px;
                }

                ul li a {
                    text-decoration: none;
                    color: #2575fc;
                    background: #fff;
                    padding: 10px 20px;
                    border-radius: 5px;
                    transition: background 0.3s, color 0.3s;
                    font-size: 16px;
                }

                ul li a:hover {
                    background: #6a11cb;
                    color: #fff;
                }

                a {
                    margin-top: 20px;
                    color: #fff;
                    text-decoration: none;
                    font-size: 16px;
                    padding: 10px 20px;
                    border: 1px solid #fff;
                    border-radius: 5px;
                    transition: background 0.3s, color 0.3s;
                }

                a:hover {
                    background: #fff;
                    color: #2575fc;
                }
            </style>
        </head>
        <body>
            <h1>Menu</h1>
            <p>Último acesso: ${lastAccess}</p>
            <ul>
                <li><a href="/cadastro">Cadastro de Usuários</a></li>
                <li><a href="/batePapo">Bate-papo</a></li>
            </ul>
            <a href="/logout">Logout</a>
        </body>
        </html>
    `);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Cadastro de usuários
app.get('/cadastro', checkLogin, (req, res) => {
    let userList = users.map(u => `<li>${u.nome} (${u.nickname})</li>`).join('');
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cadastro de Usuários</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #6a11cb, #2575fc);
                    color: #fff;
                    text-align: center;
                }

                h1 {
                    margin-bottom: 30px;
                }

                form {
                    background: #fff;
                    color: #333;
                    padding: 20px 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 350px;
                }

                input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 16px;
                }

                button {
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    background-color: #2575fc;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                }

                button:hover {
                    background-color: #6a11cb;
                }

                h2 {
                    margin-top: 40px;
                    font-size: 20px;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 10px 0;
                    color: #fff;
                }

                ul li {
                    margin: 5px 0;
                    font-size: 16px;
                }

                a {
                    margin-top: 20px;
                    color: #fff;
                    text-decoration: none;
                    font-size: 16px;
                    padding: 10px 20px;
                    border: 1px solid #fff;
                    border-radius: 5px;
                    transition: background 0.3s, color 0.3s;
                }

                a:hover {
                    background: #fff;
                    color: #2575fc;
                }
            </style>
        </head>
        <body>
            <h1>Cadastro de Usuários</h1>
            <form method="POST" action="/cadastrar">
                <input type="text" name="nome" placeholder="Nome" required>
                <input type="date" name="dataNascimento" required>
                <input type="text" name="nickname" placeholder="Apelido" required>
                <button type="submit">Cadastrar</button>
            </form>
            <h2>Usuários cadastrados</h2>
            <ul>${userList}</ul>
            <a href="/menu">Voltar ao menu</a>
        </body>
        </html>
    `);
});


app.post('/cadastrar', checkLogin, (req, res) => {
    const { nome, dataNascimento, nickname } = req.body;
    if (!nome || !dataNascimento || !nickname) {
        return res.send(`<p>Todos os campos são obrigatórios!</p><a href="/cadastro">Voltar</a>`);
    }
    users.push({ nome, dataNascimento, nickname });
    res.redirect('/cadastro');
});

// Bate-papo
app.get('/batePapo', checkLogin, (req, res) => {
    let userOptions = users.map(u => `<option value="${u.nickname}">${u.nome}</option>`).join('');
    let chatMessages = messages.map(m => `<li class="message"><strong>${m.user}:</strong> ${m.message} (${m.timestamp})</li>`).join('');
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bate-papo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #6a11cb, #2575fc);
                    color: #fff;
                    text-align: center;
                }

                h1 {
                    margin-bottom: 20px;
                }

                form {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 400px;
                }

                select, textarea, button {
                    width: 100%;
                    padding: 12px;
                    margin: 10px 0;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 16px;
                    box-sizing: border-box;
                }

                button {
                    background-color: #2575fc;
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                button:hover {
                    background-color: #6a11cb;
                }

                textarea {
                    resize: none;
                    min-height: 100px;
                }

                h2 {
                    margin-top: 20px;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                    max-width: 600px;
                    width: 100%;
                    overflow-y: auto;
                    max-height: 300px;
                    margin-bottom: 40px;
                }

                .message {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    text-align: left;
                }

                .message strong {
                color: #2575fc;
                text-shadow: 0px 0px 2px #fff;
                }

                a {
                    margin-top: 20px;
                    color: #fff;
                    text-decoration: none;
                    font-size: 16px;
                    padding: 10px 20px;
                    border: 1px solid #fff;
                    border-radius: 5px;
                    transition: background 0.3s, color 0.3s;
                }

                a:hover {
                    background: #fff;
                    color: #2575fc;
                }
            </style>
        </head>
        <body>
            <h1>Bate-papo</h1>
            <form method="POST" action="/postarMensagem">
                <select name="user" required>
                    <option value="">Selecione um usuário</option>
                    ${userOptions}
                </select>
                <textarea name="message" placeholder="Digite sua mensagem..." required></textarea>
                <button type="submit">Enviar</button>
            </form>
            <h2>Mensagens</h2>
            <ul>${chatMessages}</ul>
            <a href="/menu">Voltar ao menu</a>
        </body>
        </html>
    `);
});

app.post('/postarMensagem', checkLogin, (req, res) => {
    const { user, message } = req.body;
    if (!user || !message) {
        return res.send(`<p>Usuário e mensagem são obrigatórios!</p><a href="/batePapo">Voltar</a>`);
    }
    messages.push({ user, message, timestamp: new Date().toLocaleString() });
    res.redirect('/batePapo');
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

