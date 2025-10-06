# Portfolio Forge 🚀

Portfolio Forge ek full-stack web application hai jo users ko apna personal portfolio website banane, manage karne, aur live deploy karne me madad karta hai. Isme AI-powered content enhancement jaisa advanced feature bhi hai.

## ✨ Features

* **Google Authentication:** Google account se aasan login.
* **Portfolio Management:** Bio, skills, projects, education, aur certifications ko aaram se add, edit, ya delete karein.
* **AI Content Enhancement:** Cloudflare Workers AI ka istemal karke apne bio aur project descriptions ko professional banayein.
* **Real-time Live Preview:** Left side me changes karein aur right side me unka live preview dekhein.
* **Theme Customization:** Apne portfolio ka font, background color, text color, aur accent color chunein.
* **Public URL:** Har user ko ek unique public URL milta hai (`/p/your-user-id`) jise woh share kar sakta hai.
* **Web Resume:** Ek alag se, saaf-suthra web resume page jo PDF me download kiya ja sakta hai.

## 🛠️ Tech Stack

* **Frontend:** React, React Router, Firebase SDK
* **Backend:** Firebase (Authentication, Firestore, Storage, Cloud Functions for Python)
* **External APIs:** Cloudflare Workers AI (`mistral-7b-instruct-v0.1`)
* **Styling:** Plain CSS

## ⚙️ Local Setup

Is project ko apne local computer par chalane ke liye:

### Prerequisites

* Node.js (v18 ya usse upar)
* Python (v3.11 ya usse upar)
* Firebase CLI

### Installation & Running

1.  **Repository ko Clone karein:**
    ```bash
    git clone [https://github.com/your-username/Portfolio-Forge-Full-Project.git](https://github.com/your-username/Portfolio-Forge-Full-Project.git)
    cd Portfolio-Forge-Full-Project
    ```

2.  **Backend Setup:**
    ```bash
    cd portfolio-forge-backend
    # Virtual environment banayein aur activate karein
    python -m venv venv
    source venv/bin/activate  # Mac/Linux
    # .\venv\Scripts\activate  # Windows

    # Dependencies install karein
    pip install -r requirements.txt

    # .env file banayein aur apni Cloudflare keys daalein
    # CF_API_KEY=your_key
    # CF_ACCOUNT_ID=your_id
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../portfolio-forge
    npm install

    # .env file banayein aur apni Firebase config keys daalein
    # REACT_APP_FIREBASE_API_KEY=your_key
    # ...
    ```

4.  **Project ko Chalayein:**
    * Ek terminal me, `portfolio-forge-backend` folder se Firebase Emulator start karein:
        ```bash
        firebase emulators:start
        ```
    * Dusre terminal me, `portfolio-forge` folder se React app start karein:
        ```bash
        npm start
        ```

## 🚀 Deployment

Yeh project Firebase par deploy kiya gaya hai.
1.  Frontend app ko build karein (`npm run build`).
2.  `build` folder ko `portfolio-forge-backend` folder ke andar copy karein.
3.  Backend folder se `firebase deploy` command chalayein.
