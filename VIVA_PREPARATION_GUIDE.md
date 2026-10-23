# VIVA VOCE & TECHNICAL DEFENSE PREPARATION GUIDE
## Online Complaint Registration and Tracking System
### *Internal Assessment in Web Technology (Target: 4/4 Marks - Excellent)*

---

## 1. PROJECT ELEVATOR PITCH (HOW TO INTRODUCE YOUR PROJECT TO THE EXAMINER)
> *"Good morning/afternoon, Respected Evaluators. Today, I am presenting my Web Technology project titled **'Online Complaint Registration and Tracking System'**.  
> The system addresses a major operational bottleneck in institutions: untracked grievances, lost paper complaints, and lack of accountability.  
> 
> We have built a full-stack, responsive web application utilizing **Node.js** and **Express.js** for the backend, **MongoDB** with **Mongoose ODM** for the database, and **Bootstrap 5.3** with modern CSS and vanilla ES6 JavaScript for the frontend.  
> 
> Key technical highlights include:
> 1. **Dual-Layer Validation:** Every field is validated both on the client-side for immediate visual UX feedback and on the server-side via `express-validator` to prevent SQL/NoSQL injection and data corruption.
> 2. **Instant Ticket & QR Code Generation:** On submission, the system generates a collision-free tracking ID (e.g. `CMP-2026-XXXXX`) along with a dynamically rendered base64 QR code for direct mobile tracking.
> 3. **Real-time Lifecycle Stepper:** Citizens monitor their case through a 4-phase progress visualizer (Submitted &rarr; Under Review &rarr; In Progress &rarr; Resolved).
> 4. **Citizen Feedback Loop:** Once resolved, citizens rate resolution quality via an interactive 5-star rating widget.
> 5. **Administrative Dashboard:** Department officers can log in securely via JWT authentication, analyze department-wise distributions with **Chart.js**, filter grievances, assign officers, and export records as CSV files for audit reporting."*

---

## 2. KEY TECHNICAL CONCEPTS & VIVA QUESTIONS

### SECTION A: NODE.JS & EXPRESS.JS CONCEPTS

#### Q1: What is Node.js, and how does its Event-Driven, Non-Blocking I/O model work?
**Answer:**  
Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 JavaScript engine. It operates on a **single-threaded event loop** utilizing non-blocking, asynchronous I/O operations supported by the `libuv` C library.  
When an I/O operation (such as querying MongoDB or reading an uploaded file via Multer) is initiated, Node.js offloads the operation to libuv's worker thread pool without blocking the main execution thread. Once completed, a callback or Promise resolution is pushed to the Event Queue and processed by the Event Loop. This allows our server to handle thousands of concurrent citizen requests with minimal memory overhead.

#### Q2: What is Middleware in Express.js, and which middlewares are used in this project?
**Answer:**  
In Express.js, middleware functions have access to the Request object (`req`), the Response object (`res`), and the `next` function in the application’s request-response cycle. Middlewares can execute code, modify request/response objects, end the cycle, or invoke the next middleware.  
In our project, we implemented:
1. **Application-level Middlewares:** `express.json()` and `express.urlencoded()` for request body parsing, `cors()` for cross-origin requests, `morgan('dev')` for HTTP logging, and `express.static()` to serve public assets and uploaded files.
2. **Custom Validation Middleware (`middleware/validation.js`):** Uses `express-validator` chains to sanitize and validate input fields, returning HTTP 400 with field-specific error maps.
3. **File Handling Middleware (`middleware/upload.js`):** Uses `multer` configured with disk storage, file size limits (5MB), and MIME type filters (JPEG, PNG, WEBP, PDF).
4. **Authentication Middleware (`middleware/auth.js`):** Verifies JWT Bearer tokens on protected administrative endpoints.
5. **Error-Handling Middleware:** A 4-argument `(err, req, res, next)` function at the end of `server.js` catching Multer errors and uncaught exceptions.

#### Q3: What is the difference between Synchronous and Asynchronous code in Node.js? Why did you use `async/await`?
**Answer:**  
Synchronous operations block thread execution until completion, freezing all other incoming requests. Asynchronous operations return Promises immediately, allowing the Event Loop to proceed.  
We used modern `async/await` syntax because it provides cleaner, readable, synchronous-looking code while retaining non-blocking asynchronous execution under the hood, completely eliminating "callback hell".

#### Q4: What are RESTful APIs and what HTTP methods did you implement?
**Answer:**  
REST (Representational State Transfer) is an architectural style for networked applications using standard HTTP protocols:
- `GET /api/complaints/public-stats` – Retrieves aggregate counters (Safe & Idempotent).
- `GET /api/complaints/track` – Retrieves a specific complaint by ID (Safe & Idempotent).
- `POST /api/complaints` – Creates a new complaint resource (Non-idempotent).
- `PUT /api/admin/complaints/:id/status` – Replaces or updates the status/resolution of an existing complaint (Idempotent).
- `DELETE /api/admin/complaints/:id` – Removes a complaint resource (Idempotent).

---

### SECTION B: MONGODB & DATABASE PERSISTENCE

#### Q5: Why did you choose MongoDB over a traditional Relational Database (SQL)?
**Answer:**  
1. **Flexible, Document-Oriented Schema:** Grievance data contains nested structures (such as complainant info, timeline audit arrays, and feedback) which map naturally to JSON/BSON documents without complex multi-table joins.
2. **Dynamic Timeline Array:** Each complaint maintains an array of status transitions with timestamps and notes. In SQL, this requires a separate `timeline_events` table with foreign key relationships. In MongoDB, it is embedded atomically inside the document.
3. **High Write Throughput & Scalability:** MongoDB easily handles burst write traffic when many grievances are submitted simultaneously.

#### Q6: What is Mongoose and how does it benefit the application?
**Answer:**  
Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides:
- **Schema Validation:** Strict type casting, required field checks, regex validation, and enum bounds (`Pending`, `In Progress`, `Resolved`, etc.).
- **Middleware Hooks:** Pre-save hooks used to automatically hash admin passwords using `bcrypt.js`.
- **Indexing:** Facilitating fast single-field, compound, and full-text search indexes across `complaintId`, `title`, and `description`.

#### Q7: How did you ensure Complaint IDs are unique and avoid collisions?
**Answer:**  
We implemented an algorithmic ID generator in `utils/idGenerator.js` combining the current calendar year with a cryptographically randomized 5-digit number (`CMP-YYYY-XXXXX`).  
Before persisting the document, the controller runs an asynchronous collision check:
```javascript
let complaintId = generateComplaintId();
let exists = await Complaint.findOne({ complaintId });
while (exists) {
  complaintId = generateComplaintId();
  exists = await Complaint.findOne({ complaintId });
}
```
Furthermore, the Mongoose schema enforces `{ unique: true, index: true }` at the database level, guaranteeing absolute uniqueness.

---

### SECTION C: FRONT-END, UI & INPUT VALIDATION

#### Q8: How did you implement dual-layer input validation?
**Answer:**  
- **Layer 1: Client-Side (User Experience):** In `public/js/register.js`, input event listeners inspect field values in real-time on `input` and `blur`. Using regular expressions, we validate:
  - Full Name: `/^[a-zA-Z\s.'-]+$/` (length 2–70).
  - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`.
  - Phone: Exactly 10 digits `/^[0-9]{10}$/`.
  - Title: 5 to 120 characters with live character counter.
  - Description: 15 to 2000 characters with live character counter.  
  Fields dynamically receive `.is-valid` (green border) or `.is-invalid` (red border with custom error feedback text).
- **Layer 2: Server-Side (Security Guarantee):** Client-side validation can be bypassed by disabling JavaScript or using cURL/Postman. Therefore, `middleware/validation.js` runs `express-validator` sanitization and rules before any database operation. If any field fails, an HTTP 400 response is returned with an array of errors mapped by field name.

#### Q9: How is the Progress Stepper rendered on the tracking page?
**Answer:**  
In `public/js/track.js`, we map each status to a numeric progression step:
`Pending = 1`, `Under Review = 2`, `In Progress = 3`, `Resolved = 4`.  
The progress bar width is dynamically calculated in CSS:
`const progressPercent = ((currentStageNum - 1) / 3) * 100;`  
Steps less than `currentStageNum` receive the class `.completed` (green checkmark), the current step receives `.active` (pulsing blue ring), and upcoming steps remain neutral gray. If the status is `Rejected`, a dedicated warning banner is rendered instead.

#### Q10: How does the Direct QR Code Tracking feature work?
**Answer:**  
During complaint registration in `complaintController.js`, we construct the direct URL:  
`const trackingUrl = http://${host}/track.html?id=${complaintId};`  
We pass this URL to the `qrcode.toDataURL()` library, which generates a base64-encoded Data URL representing the PNG image. This base64 string is stored directly in the MongoDB document and rendered in the success modal and printable acknowledgment slip. When scanned with a smartphone camera, the citizen's browser immediately opens `track.html?id=CMP-...` and loads their case.

---

### SECTION D: SECURITY & AUTHENTICATION

#### Q11: How is Administrator Authentication secured?
**Answer:**  
1. **Bcrypt Password Hashing:** Passwords are never stored in plaintext. When an administrator is seeded or registered, Mongoose runs a pre-save hook that generates a 10-round salt and hashes the password via `bcrypt.hash()`.
2. **JWT (JSON Web Token):** Upon login, `bcrypt.compare()` verifies the credentials. If valid, the server signs a JWT containing the admin ID, name, role, and department, configured with an expiration of 24 hours.
3. **Protected Route Verification:** Administrative API requests send the token in the `Authorization: Bearer <token>` header. The `authenticateAdmin` middleware verifies the cryptographic signature with `jwt.verify()`. If missing or expired, an HTTP 401 Unauthorized status is returned.

#### Q12: How do you prevent Cross-Site Scripting (XSS)?
**Answer:**  
We prevent XSS in two ways:
1. **Sanitization Helper (`escapeHTML`):** In `public/js/main.js`, all user-supplied data displayed via innerHTML passes through `escapeHTML()`, which converts `<`, `>`, `&`, `"`, and `'` into their corresponding HTML entities.
2. **Server-Side Normalization:** Emails and usernames are strictly normalized and lowercased; names are stripped of script injection tags.

---

## 3. CODE WALKTHROUGH TALKING POINTS

When the examiner asks you to open a specific file, here is what to highlight:

| File Name | Key Code Section to Explain |
| :--- | :--- |
| **`server.js`** | Lines 1–40: Express initialization, middleware pipeline (`cors`, `morgan`, `express.json()`, `express.static()`), and clean separation of static HTML routes and REST API routers. |
| **`config/db.js`** | Mongoose connection with `process.env.MONGODB_URI` and fallback to local instance `mongodb://127.0.0.1:27017/complaint_system`. |
| **`models/Complaint.js`** | Demonstrates Mongoose Schema design: sub-schema `TimelineEntrySchema`, regex validations, enum constraints, and compound text indexes for search. |
| **`middleware/validation.js`** | Express-validator chains for registration, tracking, status updating, and feedback, followed by `handleValidationErrors` which returns structured JSON errors. |
| **`middleware/upload.js`** | Multer diskStorage with unique sanitized filename generation and `fileFilter` validating both extensions and MIME types. |
| **`controllers/complaintController.js`** | `registerComplaint`: unique ID generation loop, QR code generation, Multer file handling, and saving to MongoDB. |
| **`controllers/adminController.js`** | `getDashboardStats`: MongoDB Aggregation pipelines (`$group`) for department and priority charts; `exportComplaintsCSV`: streaming CSV formatted records. |
| **`public/js/register.js`** | Real-time input validation handlers, character counters, file preview generator, and `FormData` AJAX submit. |
| **`public/js/track.js`** | Stepper progress calculation, timeline stream rendering, and interactive 5-star rating widget. |
| **`public/js/admin.js`** | Chart.js initialization (Doughnut and Bar charts), JWT token management, live filter debouncing, and status update modal handling. |

---

## 4. RAPID-FIRE VIVA REVISION (CHEAT SHEET)

1. **Port number:** `5000` (configurable via `.env`).
2. **MongoDB Port:** `27017` (default MongoDB community service).
3. **Database Name:** `complaint_system`.
4. **Seed Command:** `npm run seed` (seeds SuperAdmin `admin` / `admin123` and 6 complaints).
5. **Start Command:** `npm start` (or `npm run dev` with Node watch mode).
6. **Chart library used:** Chart.js v4.4.1.
7. **CSS Framework:** Bootstrap 5.3.3 + Custom CSS variables and animations.
8. **File upload directory:** `./uploads/` (auto-created if missing).
9. **Max file upload size:** 5 MB.
10. **Allowed file types:** JPG, JPEG, PNG, WEBP, PDF.
11. **Complaint ID format:** `CMP-YYYY-XXXXX` (e.g., `CMP-2026-10492`).
12. **Status Lifecycles:** Pending &rarr; Under Review &rarr; In Progress &rarr; Resolved (or Rejected).

---
*Equipped with this guide, you can confidently explain every module, justify technical design choices, and achieve full marks in your internal assessment.*
