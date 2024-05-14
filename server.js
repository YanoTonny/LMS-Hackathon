// server.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { check, validationResult } = require('express-validator');
const app = express();
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT;

// Configure session middleware
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect();

// Serve static files from the default directory
app.use(express.static(__dirname));

// Set up middleware to parse incoming JSON data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'rgfgghdhethhhdkjgruffhghsghgdg',
    resave: false,
    saveUninitialized: true
}));

app.post('/login', (req, res) =>{
    if(validLogin){
        req.session.username = username;
        req.session.email = email;
        req.session.successfulLogin = true;
    } else {
        res.redirect('/login');

    }

});

// securing routes
const isAuthenticated = (req, res) => {
    if(req.session.successfulLogin){
        next();
    } else {
        res.redirect('/login');
    }

}

// Define routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Registration route
app.post('/register', [
    // Validate email and username fields
    check('email').isEmail(),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),

    // Custom validation to check if email and username are unique
    check('email').custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
            throw new Error('Email already exists');
        }
    }),
    check('username').custom(async (value) => {
        const user = await User.findOne({ username: value });
        if (user) {
            throw new Error('Username already exists');
        }
    }),
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create a new user object
    const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword,
        full_name: req.body.full_name
    });

    // Save the user to the database
    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser); // Return the newly created user
    } catch (err) {
        res.status(500).json({ error: err.message }); // Handle database errors
    }
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Retrieve user from database
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            res.status(401).send('Invalid username or password');
        } else {
            const user = results[0];
            // Compare passwords
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    // Store user in session
                    req.session.user = user;
                    res.send('Login successful');
                } else {
                    res.status(401).send('Invalid username or password');
                }
            });
        }
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logout successful');
});

//Dashboard route
app.get('/dashboard', (req, res) => {
    // Assuming you have middleware to handle user authentication and store user information in req.user
    const userFullName = req.user.full_name;
    res.render('dashboard', { fullName: userFullName });
});

// Course Selection route
app.post('/select-courses', (req, res) => {
    const { selectedCourses } = req.body;
    const userId = req.session.user.id; // Assuming you store user id in session

    // Insert selected courses into database
    const sql = 'INSERT INTO user_courses (user_id, course_id) VALUES ?';
    const values = selectedCourses.map(courseId => [userId, courseId]);
    connection.query(sql, [values], (err, result) => {
        if (err) {
            console.error('Error inserting selected courses:', err);
            res.status(500).send('Failed to select courses');
        } else {
            res.status(200).send('Courses selected successfully');
        }
    });
});

// Fetch selected courses for the current user
app.get('/selected-courses', (req, res) => {
    const userId = req.session.user.id; // Assuming you store user id in session

    // Fetch selected courses from database for the current user
    const sql = 'SELECT * FROM courses INNER JOIN user_courses ON courses.id = user_courses.course_id WHERE user_courses.user_id = ?';
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching selected courses:', err);
            res.status(500).send('Failed to fetch selected courses');
        } else {
            res.status(200).json(results);
        }
    });
});


// Route to retrieve course content
app.get('/course/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'SELECT * FROM courses WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
      if (err) {
        throw err;
      }
      // Send course content as JSON response
      res.json(result);
    });
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
