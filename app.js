const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { default: next } = require('next');

const path = require('path');
const ExpressError = require('./utils/ExpressError');
const User = require('./models/user');
const campgrounds = require('./routes/campground');
const reviews = require('./routes/review');


mongoose.connect('mongodb://localhost:27017/yelp-camp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error!"));
db.once("open", () => {
  console.log("Database connected!");
})

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
  secret: 'tajnarijec',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}



app.use(session(sessionConfig));
app.use(flash())

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.use('/campgrounds', campgrounds);
app.use('/campgrounds/:id/reviews', reviews);



app.get('/', (req, res) => {
  res.redirect("/login")
})
app.get('/register', (req, res) => {
  res.render('register');
})
app.post('/register', async (req, res) => {
  const { username, password } = req.body.user;
  const temp = await User.findOne({username});
  if (username == '' || temp) {
    req.flash('error', 'Try with other username!')
    return res.redirect('/register');
  }
  const hash = await bcrypt.hash(password, 12);
  const user = new User({ username, password: hash });
  await user.save();
  req.flash('success', `Successfully created new user (${username})`);
  res.redirect('/campgrounds');


})
app.get('/login', (req, res) => {
  res.render('login');
})
app.post('/login', async (req, res) => {
  const { username, password } = req.body.user;
  const user = await User.findOne({ username });
  if (!user) {
    req.flash('error', 'Login failed. Try again!');
    return res.redirect('/login');
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    req.flash('error', 'Login failed. Try again!');
    return res.redirect('/login');
  }
  req.session.username = username;
  req.session.user_id = user._id;
  res.redirect('/campgrounds');
})
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
})
app.all('*', (req, res, next) => {
  next(new ExpressError('Page not found', 404));
})

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message == 'Something went wrong!';
  res.status(statusCode).render('error', { err, statusCode });
})

app.listen(8080, () => {
  console.log("Listening on port 8080");
})
