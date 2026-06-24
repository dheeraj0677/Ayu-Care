# 🏥 AyuCare Hospital Appointment System

AyuCare is a modern, comprehensive digital healthcare platform that allows patients to search for doctors, book appointments, view health records, and receive digital prescriptions. It features dedicated portals for patients, doctors, and administrators.

![AyuCare Banner](https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1200)

## ✨ Features

### For Patients 🧑‍⚕️
- **Easy Registration & Login**: Secure authentication system.
- **Find Specialists**: Browse and search doctors by department and specialty.
- **Seamless Booking**: Select a date and available timeslot to book an appointment instantly.
- **Patient Dashboard**: View upcoming appointments, past medical history, and latest health vitals.
- **Digital Health Records**: Access prescriptions, lab reports, and vitals securely.
- **Notifications**: Get notified about upcoming appointments and available test results.

### For Doctors 🩺
- **Schedule Management**: View today's schedule and upcoming appointments.
- **Patient Profiles**: Access patient history and previous consultation notes.
- **Digital Prescriptions**: Generate, manage, and share electronic prescriptions.
- **Availability Management**: Set available days and timeslots.

### For Administrators ⚙️
- **Comprehensive Analytics**: View revenue, total appointments, and department performance.
- **Staff Management**: Add and manage doctors, staff, and system users.
- **Department Setup**: Manage hospital departments and services.
- **Audit Logging**: Track all system activities and security events.

## 🛠️ Technology Stack

**Backend:**
- **Node.js & Express**: Core application server.
- **MongoDB & Mongoose**: NoSQL database and ODM for data management.
- **JWT & bcryptjs**: Secure, stateless authentication and password hashing.
- **Multer**: Secure file upload handling.
- **Helmet & Rate Limit**: Security and DDoS protection middlewares.

**Frontend:**
- **Vanilla HTML5 & CSS3**: No heavy frameworks, ensuring fast load times.
- **Custom CSS Design System**: A robust, token-based design system featuring glassmorphism, responsive grids, and modern healthcare aesthetics (Purple, Light Gray, Soft Green).
- **Vanilla JavaScript**: Fetch API for backend communication.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance or Atlas URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dheeraj0677/Ayu-Care.git
   cd Ayu-Care
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `MONGO_URI` is correctly pointing to your MongoDB instance)*

4. **Seed the Database (Optional but recommended):**
   This will populate the database with sample departments, doctors, patients, and appointments to get you started quickly.
   ```bash
   npm run seed
   ```
   *Sample Login Credentials after seeding:*
   - Admin: `admin@ayucare.com` / `Admin@123`
   - Doctor: `sarah.jenkins@ayucare.com` / `Doctor@123`
   - Patient: `john@example.com` / `Patient@123`

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` (by default). The frontend is served statically from the `/client` directory on the same port.

## 📁 Project Structure

```
Ayu-Care/
├── client/                 # Frontend HTML, CSS, and JS
│   ├── css/                # Custom Design System (variables, layout, components)
│   ├── js/                 # API wrapper and frontend logic
│   └── *.html              # UI Pages (Dashboards, Booking, Auth)
├── config/                 # Database, CORS, and JWT configurations
├── controllers/            # Request handlers (business logic)
├── database/               # Seeding scripts
├── middleware/             # Auth, validation, error, and upload middlewares
├── models/                 # Mongoose schema definitions
├── routes/                 # Express API route definitions
├── services/               # Background services (Email, Analytics, Notifications)
├── uploads/                # Local storage for medical documents
├── utils/                  # Helper functions and standardized API responses
├── server.js               # Application entry point
└── package.json            # Project metadata and scripts
```

## 🔐 Security Highlights

- **RBAC (Role-Based Access Control)**: Middleware explicitly checks if a user is a `patient`, `doctor`, or `admin` before granting route access.
- **Input Validation**: Request bodies are strictly validated before hitting the controllers.
- **Audit Logging**: Important actions (Login, Update, Delete) are logged for administrative review.
- **Sanitization**: MongoDB query sanitization prevents injection attacks.

## 📄 License

This project is licensed under the MIT License.
