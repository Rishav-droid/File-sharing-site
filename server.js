const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// Update CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition', 'Content-Length']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        // You can add file type restrictions here if needed
        cb(null, true);
    }
});

// In-memory database (replace with a real database in production)
const users = [];
const files = [];
const shares = [];

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate session token (in a real app, use JWT)
        const token = crypto.randomBytes(64).toString('hex');
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// File upload
app.post('/api/upload', upload.array('files'), (req, res) => {
    try {
        const uploadedFiles = req.files;
        const userId = req.body.userId || 'anonymous'; // Use user ID if logged in
        
        const fileEntries = uploadedFiles.map(file => {
            const fileId = uuidv4();
            const fileEntry = {
                id: fileId,
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                userId,
                uploadedAt: new Date(),
                shareId: generateShareId()
            };
            
            files.push(fileEntry);
            
            // Create a share entry
            const shareEntry = {
                id: fileEntry.shareId,
                fileId: fileId,
                createdAt: new Date(),
                expiresAt: null, // No expiration by default
                password: null, // No password by default
                downloads: 0
            };
            
            shares.push(shareEntry);
            
            return fileEntry;
        });
        
        res.status(201).json({
            message: 'Files uploaded successfully',
            files: fileEntries.map(file => ({
                id: file.id,
                originalName: file.originalName,
                size: file.size,
                shareId: file.shareId,
                shareUrl: `${req.protocol}://${req.get('host')}/s/${file.shareId}`
            }))
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get file by share ID
app.get('/api/share/:shareId', (req, res) => {
    try {
        const { shareId } = req.params;
        const { password } = req.query;
        
        // Find share
        const share = shares.find(share => share.id === shareId);
        if (!share) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Check if share has expired
        if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
            return res.status(410).json({ error: 'Link has expired' });
        }
        
        // Check password if required
        if (share.password) {
            if (!password) {
                return res.status(401).json({ error: 'Password required', passwordRequired: true });
            }
            
            const passwordMatch = bcrypt.compareSync(password, share.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }
        
        // Find file
        const file = files.find(file => file.id === share.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Increment download counter
        share.downloads += 1;
        
        res.json({
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            mimetype: file.mimetype,
            downloadUrl: `${req.protocol}://${req.get('host')}/api/download/${share.id}`
        });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download file
app.get('/api/download/:shareId', (req, res) => {
    try {
        const { shareId } = req.params;
        
        // Find share
        const share = shares.find(share => share.id === shareId);
        if (!share) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Find file
        const file = files.find(file => file.id === share.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Set proper headers
        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
            'Access-Control-Expose-Headers': 'Content-Disposition'
        });
        
        // Send file
        res.sendFile(file.path);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update share settings
app.put('/api/share/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { password, expiresAt } = req.body;
        
        // Find share
        const share = shares.find(share => share.id === shareId);
        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }
        
        // Update password if provided
        if (password !== undefined) {
            share.password = password ? await bcrypt.hash(password, 10) : null;
        }
        
        // Update expiration if provided
        if (expiresAt !== undefined) {
            share.expiresAt = expiresAt ? new Date(expiresAt) : null;
        }
        
        res.json({
            id: share.id,
            expiresAt: share.expiresAt,
            hasPassword: !!share.password
        });
    } catch (error) {
        console.error('Update share error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's files
app.get('/api/files', (req, res) => {
    try {
        const userId = req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        // Find user's files
        const userFiles = files.filter(file => file.userId === userId);
        
        res.json(userFiles.map(file => ({
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            uploadedAt: file.uploadedAt,
            shareId: file.shareId,
            shareUrl: `${req.protocol}://${req.get('host')}/s/${file.shareId}`
        })));
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete file
app.delete('/api/files/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.query.userId;
        
        // Find file
        const fileIndex = files.findIndex(file => file.id === fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const file = files[fileIndex];
        
        // Check if user owns the file
        if (file.userId !== userId && file.userId !== 'anonymous') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Delete file from disk
        fs.unlinkSync(file.path);
        
        // Remove file from array
        files.splice(fileIndex, 1);
        
        // Remove associated shares
        const shareIndex = shares.findIndex(share => share.fileId === fileId);
        if (shareIndex !== -1) {
            shares.splice(shareIndex, 1);
        }
        
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve share page
app.get('/s/:shareId', (req, res) => {
    res.sendFile(path.join(__dirname, 'share.html'));
});

// Helper function to generate a share ID
function generateShareId() {
    return crypto.randomBytes(6).toString('hex');
}

// Replace the last app.listen section with this:
const host = process.env.HOST || '0.0.0.0';
app.listen(PORT, host, () => {
    console.log(`Server running on http://${host}:${PORT}`);
    if (host === '0.0.0.0') {
        const networkInterfaces = require('os').networkInterfaces();
        const addresses = [];
        for (const k in networkInterfaces) {
            for (const k2 of networkInterfaces[k]) {
                if (k2.family === 'IPv4' && !k2.internal) {
                    addresses.push(k2.address);
                }
            }
        }
        console.log('Available on:');
        addresses.forEach(addr => {
            console.log(`  http://${addr}:${PORT}`);
        });
    }
});