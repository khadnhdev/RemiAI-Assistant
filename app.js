require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
const aiConfigRoutes = require('./routes/aiConfigRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

// Import services
const schedulerService = require('./services/schedulerService');

// Khởi tạo database trước khi khởi động ứng dụng
require('./config/init-db');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

// Routes
app.use('/', adminRoutes);
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/reminders', require('./routes/reminderRoutes'));
app.use('/recipients', require('./routes/recipientRoutes'));
app.use('/ai-configs', require('./routes/aiConfigRoutes'));

// Thêm route debug nếu đang trong môi trường phát triển
if (process.env.NODE_ENV === 'development') {
  const debugRoutes = require('./routes/debugRoutes');
  app.use('/debug', debugRoutes);
  console.log('Đã kích hoạt route debug (/debug)');
}

// Khởi động scheduler
schedulerService.initScheduler();

// Start server
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Cổng ${PORT} đang bận, thử cổng ${PORT + 1}`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1);
    }, 1000);
  }
});

server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${server.address().port}`);
}); 