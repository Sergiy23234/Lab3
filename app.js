const express = require('express');
const app = express();
const session = require('express-session');
const port = 3000;

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: true }));

class User {
    constructor(username, password, userType) {
        this.username = username;
        this.password = password;
        this.userType = userType;
    }
}

let topics = [];
let users = [];

app.get('/', (req, res) => {
    res.send(`
    <h1>Форум</h1>
    <h2>Теми</h2>
    <ul>
      ${topics.map((topic, index) => `<li><a href="/topics/${index}">${topic.title}</a></li>`).join('')}
    </ul>
    ${req.session.user ? `
      <h2>Створити нову тему</h2>
      <form action="/topics" method="POST">
        <input type="text" name="title" placeholder="Заголовок теми" required>
        <button type="submit">Створити</button>
      </form>
    ` : ''}
    
    <h2>Реєстрація</h2>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Ім'я користувача" required>
      <input type="password" name="password" placeholder="Пароль" required>
      <label for="userType">Тип користувача:</label>
      <select id="userType" name="userType">
        <option value="admin">Адміністратор</option>
        <option value="user">Звичайний користувач</option>
      </select>
      <button type="submit">Зареєструватися</button>
    </form>
    
    <h2>Авторизація</h2>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Ім'я користувача" required>
      <input type="password" name="password" placeholder="Пароль" required>
      <button type="submit">Увійти</button>
    </form>
    
    ${req.session.user && req.session.user.userType === 'admin' ? `
      <h2>Видалення допису</h2>
      <form action="/delete-post" method="POST">
        <input type="text" name="topicId" placeholder="ID теми" required>
        <input type="text" name="postId" placeholder="ID допису" required>
        <button type="submit">Видалити допис</button>
      </form>
      
      <h2>Видалення теми</h2>
      <form action="/delete-topic" method="POST">
        <input type="text" name="topicId" placeholder="ID теми" required>
        <button type="submit">Видалити тему</button>
      </form>
    ` : ''}
  `);
});

app.post('/topics', isAuthenticated, (req, res) => {
    const title = req.body.title;
    topics.push({ title: title, posts: [] });
    res.redirect('/');
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const userType = req.body.userType;

    const user = new User(username, password, userType);
    users.push(user);
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.send('Неправильне ім\'я користувача або пароль');
    }
});

app.get('/topics/:id', (req, res) => {
    const id = req.params.id;
    const topic = topics[id];

    if (!topic) {
        res.status(404).send('Тема не знайдена');
        return;
    }

    res.send(`
    <h1>${topic.title}</h1>
    <h2>Дописи</h2>
    <ul>
      ${topic.posts.map((post, index) => `
        <li>${post}
          ${req.session.user && req.session.user.userType === 'admin' ? `
            <form action="/delete-post" method="POST" style="display:inline">
              <input type="hidden" name="topicId" value="${id}">
              <input type="hidden" name="postId" value="${index}">
              <button type="submit">Видалити</button>
            </form>
          ` : ''}
        </li>
      `).join('')}
    </ul>
    ${req.session.user ? `
      <h2>Створити новий допис</h2>
      <form action="/topics/${id}/posts" method="POST">
        <textarea name="post" placeholder="Текст допису" required></textarea>
        <button type="submit">Створити</button>
      </form>
    ` : ''}
    <a href="/">Повернутися до списку тем</a>
  `);
});

app.post('/topics/:id/posts', isAuthenticated, (req, res) => {
    const id = req.params.id;
    const post = req.body.post;
    const topic = topics[id];

    if (!topic) {
        res.status(404).send('Тема не знайдена');
        return;
    }

    topic.posts.push(post);
    res.redirect(`/topics/${id}`);
});

app.post('/delete-post', isAuthenticated, (req, res) => {
    const topicId = req.body.topicId;
    const postId = req.body.postId;
    const topic = topics[topicId];

    if (!topic) {
        res.status(404).send('Тема не знайдена');
        return;
    }

    topic.posts.splice(postId, 1);
    res.redirect(`/topics/${topicId}`);
});

app.post('/delete-topic', isAuthenticated, (req, res) => {
    const topicId = req.body.topicId;

    if (topicId >= 0 && topicId < topics.length) {
        topics.splice(topicId, 1);
    }

    res.redirect('/');
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.send('Необхідно авторизуватися');
    }
}

app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});