# FileShare - Online File Sharing Website

FileShare is a modern web application that allows users to easily upload, share, and manage files online. It features a clean, responsive UI and secure file sharing capabilities.

## Features

- **Drag and Drop File Upload**: Easy file selection with preview
- **Secure File Sharing**: Generate unique links for each file
- **Password Protection**: Add password protection to shared files
- **Expiration Dates**: Set expiry dates for shared links
- **User Accounts**: Register and login to keep track of your files
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **File Storage**: Local storage (can be extended to cloud storage)
- **Authentication**: bcrypt for password hashing

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository or download the files

2. Navigate to the project directory
   ```
   cd online-file-share
   ```

3. Install dependencies
   ```
   npm install
   ```

4. Start the server
   ```
   npm start
   ```

5. Open your browser and visit `http://localhost:3000`

### Development Mode

To run the server in development mode with automatic restarts:
```
npm run dev
```

## Usage

### Uploading Files

1. Drag and drop files onto the upload area or click to browse
2. Select one or more files
3. Click the "Upload Files" button
4. Once uploaded, a share link will be generated

### Sharing Files

1. Copy the generated share link
2. Optionally add password protection or set an expiry date
3. Share the link with others

### Managing Files

1. Create an account or log in
2. View all your uploaded files in the "My Files" section
3. Delete files you no longer need

## Security Considerations

- Passwords are hashed using bcrypt
- File access can be protected with passwords
- Links can be set to expire after a certain time

## Customization

### Styling

The application uses a clean, modern design with CSS variables for easy customization. You can modify the colors, fonts, and other styles by editing the `styles.css` file.

### Storage

By default, files are stored in the `uploads` directory. For production use, consider implementing cloud storage solutions like AWS S3, Google Cloud Storage, or Azure Blob Storage.

## Production Deployment

For production deployment, consider the following:

1. Use a proper database (MongoDB, PostgreSQL, etc.) instead of in-memory storage
2. Implement cloud storage for files
3. Add proper authentication with JWT
4. Set up HTTPS for secure connections
5. Implement rate limiting to prevent abuse
6. Add logging for monitoring and debugging

## License

This project is licensed under the MIT License - see the LICENSE file for details.