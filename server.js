const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const ConnectMongo = require('connect-mongo');
const MongoStore = ConnectMongo.default || ConnectMongo;
require('dotenv').config();

const { BookRead, BookWrite } = require('./config/db');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Template engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// Stateless Session: Lưu trực tiếp lên MongoDB Atlas
app.use(session({
    secret: process.env.SESSION_SECRET || 'bui_hoang_phong_23IT208_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI_WRITE,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Route mặc định
app.get('/', (req, res) => {
    res.redirect('/books');
});

// 1. Luồng ĐỌC (Read stream): Sử dụng BookRead kết nối tài khoản Read-only
app.get('/books', async (req, res) => {
    try {
        const books = await BookRead.find().lean();
        const errorMessage = req.session.errorMessage || null;
        req.session.errorMessage = null;

        res.render('layouts/books', {
            books,
            error: errorMessage
        });
    } catch (err) {
        res.status(500).send('Lỗi luồng đọc database: ' + err.message);
    }
});

// 2. Luồng GHI (Write stream): Sử dụng BookWrite kết nối tài khoản Write-only
app.post('/books', async (req, res) => {
    try {
        const { bookCode, title, price } = req.body;
        const PREFIX = '208';       // 3 số cuối MSSV 23IT208
        const VAT_RATE = 8 + 4;

        // Kiểm tra tiền tố mã sản phẩm
        if (!bookCode || !bookCode.startsWith(PREFIX)) {
            req.session.errorMessage = `Mã sản phẩm bắt buộc phải có tiền tố là "${PREFIX}"!`;
            return res.redirect('/books');
        }

        const numPrice = Number(price);
        // Tự động tính giá sau thuế VAT 12%
        const finalPrice = numPrice + (numPrice * (VAT_RATE / 100));

        await BookWrite.create({
            bookCode,
            title,
            price: numPrice,
            vatRate: VAT_RATE,
            finalPrice
        });

        res.redirect('/books');
    } catch (err) {
        req.session.errorMessage = 'Lỗi luồng ghi database: ' + err.message;
        res.redirect('/books');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
});