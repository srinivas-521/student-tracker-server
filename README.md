# Student Tracker Backend

This is the backend server for the Student Tracker application.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a .env file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

3. Start the server:
```bash
npm start
```

## Deployment on Render

1. Push your code to GitHub

2. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Select the server directory as the root directory
   - Set the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string
     - `NODE_ENV`: production
     - `FRONTEND_URL`: Your frontend URL (e.g., https://your-frontend.vercel.app)
     - `PORT`: 10000

3. Deploy the service

## API Endpoints

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/profile - Get user profile
- GET /api/jobs - Get all jobs
- POST /api/jobs - Create a new job
- PUT /api/jobs/:id - Update a job
- DELETE /api/jobs/:id - Delete a job

## Health Check

- GET /health - Check server status 