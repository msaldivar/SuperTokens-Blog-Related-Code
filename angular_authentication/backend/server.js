    const express = require('express');
    const cors = require('cors');
    const jwt = require('jsonwebtoken');
    const cookieParser = require('cookie-parser');
    require('dotenv').config();

    const app = express();
    const PORT = process.env.PORT || 3000;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true // Important for cookies
    }));
    app.use(express.json());
    app.use(cookieParser()); // Needed to parse cookies from requests

    // Mock user database
    // IMPORTANT: In a production environment, NEVER store passwords in plain text.
    // Always use a hashing library like bcrypt to hash passwords securely.
    const users = [{
        id: 1,
        username: 'miles@web.com',
        password: 'e-1610'
    }];

    app.post('/api/login', (req, res) => {
    console.log('Login attempt received:', req.body);
    
    const { username, password } = req.body;
    console.log('Credentials extracted:', { username, password });
    
    const user = users.find(u => u.username === username);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
        console.log('User not found, returning 401');
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = password === user.password;
    console.log('Password valid:', isPasswordValid);
    console.log('Received password:', password);
    console.log('Stored password:', user.password);
    
    if (!isPasswordValid) {
        console.log('Password invalid, returning 401');
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Authentication successful, generating token');
    
    // Generate JWT
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    // Option 1: Send JWT as HttpOnly cookie (more secure)
    res.cookie('jwt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });
    console.log('Token generated and cookie set');
    
    // Option 2: Send JWT in response body (for sessionStorage)
    res.json({ 
        message: 'Login successful',
        token, // Remove this in production if using HttpOnly cookies
        user: { id: user.id, username: user.username }
    });
    console.log('Login response sent');
    });

    // User must be authd for this route
    app.get('/api/protected', verifyToken, (req, res) => {
    console.log('Protected route accessed by:', req.user?.username);
    res.json({ 
        message: 'This is protected data', 
        user: req.user,
        timestamp: new Date().toISOString()
    });
    });

    // Token verification middleware
    function verifyToken(req, res, next) {
    console.log('Verifying token...');
    
    // Option 1: Get token from cookies
    const tokenFromCookie = req.cookies?.jwt_token;
    console.log('Token from cookie:', tokenFromCookie ? 'Present' : 'Not present');
    
    // Option 2: Get token from Authorization header
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    console.log('Token from header:', tokenFromHeader ? 'Present' : 'Not present');
    
    const token = tokenFromCookie || tokenFromHeader;
    
    if (!token) {
        console.log('No token found, access denied');
        return res.status(401).json({ message: 'Access denied' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verified successfully for user:', decoded.username);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(401).json({ message: 'Invalid token' });
    }
    }

    app.post('/api/logout', (req, res) => {
    console.log('Logout request received');

    res.clearCookie('jwt_token');
    console.log('JWT cookie cleared');
    res.json({ message: 'Logged out successfully' });
    });

    app.get('/api/hello', (req, res) => {
    console.log('Hello endpoint accessed');
    res.json({ 
        message: 'Hello from the server!',
        timestamp: new Date().toISOString()
    });
    });

    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Test credentials: miles@web.com / e-1610');
    console.log('Available endpoints:');
    console.log('  POST /api/login - Login endpoint');
    console.log('  GET /api/protected - Protected endpoint (requires authentication)');
    console.log('  POST /api/logout - Logout endpoint');
    console.log('  GET /api/hello - Public test endpoint');
    });