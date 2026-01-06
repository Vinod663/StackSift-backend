# StackSift API (Backend)

The backend infrastructure for StackSift, an AI-powered developer tool directory. This RESTful API handles authentication, data persistence, AI integration via Google Gemini, and asset management.

## Project Overview

The StackSift API serves as the central logic hub for the platform. It is built using the MVC (Model-View-Controller) architecture to ensure separation of concerns. Key responsibilities include:

* **Hybrid Search Engine:** Combining database queries with Gemini 2.5 Flash to generate relevant tool suggestions when database results are insufficient.
* **Automated Analysis:** Analyzing submitted URLs to automatically generate summaries, categories, and tags.
* **Security:** Managing JWT access/refresh token rotation and verify-before-edit (sudo mode) protections.
* **Media & Communication:** Handling profile image uploads via Cloudinary and support emails via Resend.

## Technologies & Tools

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose)
* **Authentication:** JSON Web Tokens (JWT), Google Auth Library, Bcrypt.js
* **AI Model:** Google Gemini 2.5 Flash
* **Storage:** Cloudinary (Profile images)
* **Email Service:** Resend (HTTP API) 

## Prerequisites

Before running the server, ensure you have the following installed:

* Node.js (v18 or higher)
* npm or yarn
* A MongoDB Atlas connection string
* A Cloudinary account
* A Google Cloud Project (for Gemini API and OAuth Client ID)
* A Resend API Key

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd StackSift-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory. You can use `.env.example` as a reference. Add the following variables:

    ```env
    # Server Configuration
    PORT=4000
    MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/stacksift

    # Security (JWT)
    JWT_SECRET=your_strong_access_token_secret
    REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret

    # Google Services
    GOOGLE_CLIENT_ID=your_google_client_id
    GEMINI_API_KEY=your_gemini_api_key

    # Cloudinary (Image Uploads)
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Email Service (Resend)
    RESEND_API_KEY=re_123456789_your_key_here
    ```

4.  **Run the server:**
    * For development (with hot reload):
        ```bash
        npm run dev
        ```
    * For production:
        ```bash
        npm start
        ```

## Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **System** | | |
| GET | `/` | API Health Check & Status |
| **Auth** | | |
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and receive Access/Refresh tokens |
| POST | `/api/v1/auth/google` | Authenticate via Google ID Token |
| POST | `/api/v1/auth/refresh-token` | Rotate Access Token via HTTP-Only cookie |
| POST | `/api/v1/auth/verify-password` | Sudo-mode check for sensitive edits |
| **Tools** | | |
| GET | `/api/v1/post` | Fetch tools with pagination and filtering |
| POST | `/api/v1/post/addWebsite` | Submit tool (triggers AI analysis) |
| POST | `/api/v1/post/search-ai` | Trigger AI hybrid search agent |
| **User & Support** | | |
| GET | `/api/v1/user/profile` | Get user profile details |
| PUT | `/api/v1/user/profile` | Update profile info and cover template |
| POST | `/api/v1/user/avatar` | Upload profile image (Multipart/form-data) |
| POST | `/api/v1/contact` | Send support email via Resend |

## Deployment & CORS

* **Backend URL:** https://stacksift-api.onrender.com
* **Database:** MongoDB Atlas

### CORS Configuration
The backend is configured to accept requests from:
* `http://localhost:5173` (Local Development)
* `https://stacksift-frontend.vercel.app` (Production Frontend)

> **Note:** Because the backend is hosted on a free instance of Render, it may "sleep" after periods of inactivity. The first request after a long pause may take 30-50 seconds to respond.