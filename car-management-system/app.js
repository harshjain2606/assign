const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Car = require('./models/Car'); // Ensure this path is correct


const app = express();
mongoose.connect('mongodb://localhost:27017/')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Admin Login
app.get('/admin/login', (req, res) => {
    res.render('admin-login', { title: 'Assignment for Quadiro Technologies' });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && user.role === 'admin' && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

// User Login
app.get('/user/login', (req, res) => {
    res.render('user-login', { title: 'Assignment for Quadiro Technologies' });
});

app.post('/user/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && user.role === 'user' && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/user/cars');
    } else {
        res.redirect('/user/login');
    }
});

// Admin Dashboard
app.get('/admin/dashboard', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    const cars = await Car.find();
    res.render('dashboard', { cars, title: 'Admin Dashboard' });
});

// CRUD Operations for Cars
app.get('/admin/cars/new', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    res.render('cars', { car: {}, title: 'Add New Car' });
});

app.post('/admin/cars', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    const { name, year, price } = req.body;
    await Car.create({ name, year, price });
    res.redirect('/admin/dashboard');
});

app.get('/admin/cars/edit/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    const car = await Car.findById(req.params.id);
    res.render('cars', { car, title: 'Edit Car' });
});

app.post('/admin/cars/edit/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    const { name, year, price } = req.body;
    await Car.findByIdAndUpdate(req.params.id, { name, year, price });
    res.redirect('/admin/dashboard');
});

app.post('/admin/cars/delete/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/admin/login');
    await Car.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});

// User View Cars
app.get('/user/cars', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'user') return res.redirect('/user/login');
    const cars = await Car.find();
    res.render('cars', { cars, title: 'View Cars' });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
