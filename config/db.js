const mongoose = require('mongoose');
require('dotenv').config();

// Khởi tạo đồng thời 2 kết nối riêng biệt
const readConn = mongoose.createConnection(process.env.MONGO_URI_READ);
const writeConn = mongoose.createConnection(process.env.MONGO_URI_WRITE);

readConn.on('connected', () => console.log('MongoDB Read Connected (23IT208)'));
writeConn.on('connected', () => console.log('MongoDB Write Connected (23IT208)'));

const bookSchema = new mongoose.Schema({
    bookCode: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    vatRate: { type: Number, default: 12 },
    finalPrice: { type: Number, required: true }
});

const BookRead = readConn.model('Book', bookSchema);
const BookWrite = writeConn.model('Book', bookSchema);

module.exports = { BookRead, BookWrite };