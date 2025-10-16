🚀 Portfolio Forge
A full-stack web application designed to empower users to effortlessly create, manage, and deploy their personal portfolio websites. Portfolio Forge integrates AI-powered tools to help users refine their professional narrative and showcase their skills and projects to the world.

➡️ Live Demo Here (https://portfolio-forge-4e0a9.web.app/)

📸 Screenshots
(It's highly recommended to add screenshots here to give a visual overview of your application.)

✨ Core Features
Seamless Authentication: Secure and easy login/signup using Google Authentication (via Firebase).

Dynamic Portfolio Management: A full CRUD interface for managing all portfolio sections: Bio, Skills, Projects, Education, and Certifications.

AI-Powered Content Enhancement: Leverages the Cloudflare Workers AI (mistral-7b-instruct-v0.1 model) to help users professionally rewrite and enhance their bio and project descriptions.

Real-time Live Preview: A dual-pane dashboard interface provides an instant live preview of the portfolio as the user makes changes.

Theme Customization: Users can personalize their portfolio's aesthetic by choosing custom fonts, background colors, text colors, and accent colors.

Unique Public URL: Every registered user receives a unique, shareable public URL for their portfolio (e.g., /p/your-user-id).

Printable Web Resume: Generates a clean, professional, single-page web resume that can be easily printed or downloaded as a PDF.

🛠️ Technology Stack
This project is built on the MERN stack philosophy but utilizes Firebase as a powerful, serverless backend-as-a-service (BaaS) to accelerate development.

Frontend:

React: For building a dynamic and component-based user interface.

React Router: For client-side routing and navigation.

Firebase SDK (Client): For seamless integration with Firebase services on the client.

Backend (Serverless):

Firebase Authentication: For handling user registration and login.

Firestore: As the NoSQL database for storing all user and portfolio data.

Firebase Storage: For hosting user-uploaded images (e.g., profile pictures).

Cloud Functions for Python: For server-side logic, including the secure integration with the Cloudflare AI API.

External APIs:

Cloudflare Workers AI: Interfaced via a Python Cloud Function to provide AI content generation.

Styling:

Plain CSS: For lightweight, custom styling without reliance on heavy frameworks.

⚙️ Local Development Setup
Follow these instructions to get the project running on your local machine.

Prerequisites
Node.js (v18 or higher)

Python (v3.11 or higher)

Firebase CLI: npm install -g firebase-tools

Installation & Configuration
Clone the Repository:

Bash

git clone https://github.com/your-username/Portfolio-Forge-Full-Project.git
cd Portfolio-Forge-Full-Project
Backend Setup (portfolio-forge-backend):

Bash

cd portfolio-forge-backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# .\\venv\\Scripts\\activate  # Windows

# Install Python dependencies
pip install -r requirements.txt
Frontend Setup (portfolio-forge):

Bash

cd ../portfolio-forge
npm install
Environment Variables:

Backend (.env): In the portfolio-forge-backend directory, create a .env file with your Cloudflare API credentials:

Code snippet

CF_API_KEY=your_cloudflare_api_key
CF_ACCOUNT_ID=your_cloudflare_account_id
Frontend (.env.local): In the portfolio-forge directory, create a .env.local file with your Firebase project configuration keys:

Code snippet

REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
Running the Application
Start the Firebase Emulators: In one terminal, from the portfolio-forge-backend directory, run:

Bash

firebase emulators:start
This will start local emulators for Authentication, Firestore, and Functions.

Start the React Development Server: In a second terminal, from the portfolio-forge directory, run:

Bash

npm start
The application will now be running on http://localhost:3000.

🚀 Deployment
This project is configured for seamless deployment to Firebase Hosting and Cloud Functions.

Build the React App:

Bash

# From the /portfolio-forge directory
npm run build
Move the Build Folder: Copy the generated build folder from the frontend directory (/portfolio-forge) into the backend directory (/portfolio-forge-backend).

Deploy to Firebase: From the backend directory (/portfolio-forge-backend), run the deploy command:

Bash

firebase deploy
This command will deploy the Cloud Functions, Firestore rules, and the static React application to Firebase Hosting.
