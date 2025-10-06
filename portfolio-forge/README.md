# Portfolio Forge  Forge

![Portfolio Forge Dashboard](https://i.imgur.com/your-screenshot-url.png) 

**Portfolio Forge** is a powerful, real-time portfolio builder designed for students and professionals to effortlessly create, manage, and share stunning, professional online portfolios. Built with React and Firebase, it offers a seamless editing experience with a live preview and a host of modern features.

**Live Demo:** [Link to your deployed Netlify site]

---
## ✨ Features

* **Real-Time Editing:** A dual-panel dashboard with a control panel on the left and a live preview on the right that updates instantly as you type.
* **Secure Authentication:** Safe and easy sign-in using Google Authentication via Firebase.
* **Persistent Cloud Storage:** All portfolio data is securely saved in a real-time Firestore database.
* **Dynamic Professional Layout:**
    * **Customizable Sections:** Edit pre-built sections for your bio, education, projects, and skills.
    * **Professional Fields:** Add dedicated sections for **Hard Skills**, **Soft Skills**, and **Certifications** to create a comprehensive profile.
    * **Layout Templates:** Instantly switch between a modern two-column layout or a compact single-column design.
* **Portfolio Versioning:** Create and manage multiple versions of your portfolio, tailored for different job applications (e.g., "Web Dev Version," "Game Dev Version").
* **Web Resume & PDF Export:** Automatically generates a clean, shareable web resume from your portfolio data, which can be downloaded as a high-quality, clickable PDF.
* **File Uploads:** Easily upload a professional profile picture to Firebase Storage.
* **Modern UI/UX:**
    * **Toast Notifications:** Sleek, non-intrusive notifications for all actions (e.g., "Save Successful").
    * **Fully Responsive:** A professional and intuitive design that works flawlessly on all devices.

---
## 🛠️ Tech Stack

* **Frontend:** React, React Router
* **Backend & Database:** Firebase (Authentication, Firestore, Storage)
* **PDF Generation:** jsPDF, html2canvas
* **UI/UX:** React Toastify for notifications, CSS Flexbox & Grid for layouts.

---
## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### **Prerequisites**

* Node.js (v14 or later)
* npm

### **Installation & Setup**

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/portfolio-forge.git](https://github.com/your-username/portfolio-forge.git)
    cd portfolio-forge
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    * Create a project on the [Firebase Console](https://console.firebase.google.com/).
    * Add a new **Web App** to your project.
    * Copy the `firebaseConfig` object.
    * Create a file named `.env.local` in the root of your project.
    * Add your Firebase credentials to the `.env.local` file. The variable names must start with `REACT_APP_`.

    ```env
    REACT_APP_API_KEY="your-api-key"
    REACT_APP_AUTH_DOMAIN="your-auth-domain"
    REACT_APP_PROJECT_ID="your-project-id"
    REACT_APP_STORAGE_BUCKET="your-storage-bucket"
    REACT_APP_MESSAGING_SENDER_ID="your-messaging-sender-id"
    REACT_APP_APP_ID="your-app-id"
    ```

4.  **Update Firebase Config File:**
    * Open `src/firebase/config.js`.
    * Replace the placeholder `firebaseConfig` object with your environment variables.

    ```javascript
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_API_KEY,
      authDomain: process.env.REACT_APP_AUTH_DOMAIN,
      // ... and so on for all keys
    };
    ```

5.  **Run the application:**
    ```sh
    npm start
    ```
    The app will now be running on `http://localhost:3000`.

---
## ☁️ Deployment

This project is ready to be deployed on services like **Netlify** or **Vercel**.

1.  Push your code to a GitHub repository.
2.  Connect your repository to your Netlify/Vercel account.
3.  **Important:** Add your Firebase environment variables (the `REACT_APP_...` keys and values) to the "Environment Variables" section in your Netlify/Vercel project settings.
4.  Click "Deploy."

---
## 🤖 AI/ML Integration

The application is structured to easily accommodate real AI/ML models. The file `src/api/mockEnhanceAPI.js` currently contains placeholder logic. A machine learning engineer can replace the contents of this file with real API calls to a Python backend (or any other service) without needing to modify the React frontend.

---
## 👥 Authors

Forged by **ITV** (Ishaan & Vaibhav).