# Video Approval Dashboard

A web application for video editors to share videos with clients for review and approval. Clients can approve videos or provide feedback through comments.

## Features

- **User Authentication**: Secure login system with role-based access control (Editor and Client roles)
- **Email Invitations**: Send email invitations to clients with password setup links
- **Video Management**: Upload, organize, and manage videos by month
- **Dropbox Integration**: Embed videos directly from Dropbox
- **Approval System**: Clients can approve or reject videos
- **Feedback System**: Comment system for providing feedback on videos
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for sending emails
- Dropbox API for video integration

### Frontend
- React.js
- React Router for navigation
- Axios for API requests
- Bootstrap for UI components

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Dropbox Developer Account (for API access)
- Email account for sending notifications

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd video-approval-dashboard
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-approval-dashboard
JWT_SECRET=your_jwt_secret_key_change_this_in_production
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
CLIENT_URL=http://localhost:3000
```

### 4. Set up Dropbox API

1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Create a new app with the following settings:
   - API: Dropbox API
   - Access type: Full Dropbox
   - Permission type: Files and folders
3. Generate an access token and add it to your `.env` file

### 5. Run the application

```bash
# Start the backend server (from the server directory)
npm start

# In a separate terminal, start the frontend (from the client directory)
npm start
```

The application will be available at http://localhost:3000

## Initial Setup

1. The first user must be created directly in the database as an editor
2. Log in with the editor account
3. Use the admin interface to:
   - Invite clients
   - Create months
   - Upload videos for clients to review

## Project Structure

```
video-approval-dashboard/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── context/        # React context for state management
│       ├── pages/          # Page components
│       └── utils/          # Utility functions
├── server/                 # Backend Node.js application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   └── utils/              # Utility functions
└── README.md               # Project documentation
```

## License

[MIT](LICENSE)
