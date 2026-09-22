# SCMS
A web-based coaching center management system built with the MERN stack to manage students, teachers, subjects, fees, schedules, and related administrative activities.

<h1 align="center">Smart Coaching Management System</h1>

<p align="center">
  A web-based management system for organizing the academic, administrative, and financial activities of a coaching center.
</p>

---

<h2>About the Project</h2>

<p>
The <strong>Smart Coaching Management System (SCMS)</strong> is a web-based application developed to manage the day-to-day activities of a coaching center in a more organized way.
</p>

<p>
The system is designed around the practical requirements of a coaching center where student records, subject enrollment, teacher assignments, fees, schedules, and other information may otherwise be maintained through registers, spreadsheets, handwritten records, and separate communication channels.
</p>

<p>
SCMS brings these activities together in one system and provides different access levels for administrators, teachers, and students.
</p>

<h2>Project Objectives</h2>

<ul>
  <li>Maintain student and teacher records in a centralized system.</li>
  <li>Manage subjects, student enrollment, and teacher assignments.</li>
  <li>Record subject-wise fees, discounts, payments, and outstanding dues.</li>
  <li>Calculate teacher payments based on the applicable fee and commission arrangement.</li>
  <li>Manage class schedules and relevant academic information.</li>
  <li>Provide role-based access to administrators, teachers, and students.</li>
  <li>Reduce unnecessary manual work involved in maintaining and retrieving records.</li>
</ul>

<h2>Main Features</h2>

<h3>Administrator</h3>

<ul>
  <li>Manage students and teachers</li>
  <li>Manage subjects and enrollments</li>
  <li>Assign teachers to subjects</li>
  <li>Manage fees, discounts, and payments</li>
  <li>Manage teacher commission and payment records</li>
  <li>Manage class schedules</li>
  <li>Record teacher contributions and center expenses</li>
  <li>Manage notices and other administrative information</li>
</ul>

<h3>Teacher</h3>

<ul>
  <li>View assigned students and subjects</li>
  <li>View relevant student fee status</li>
  <li>View student strength</li>
  <li>View earnings and payment history</li>
  <li>View class schedules</li>
  <li>View relevant notices and contribution information</li>
</ul>

<h3>Student</h3>

<ul>
  <li>View personal profile and student ID</li>
  <li>View enrolled subjects and teachers</li>
  <li>View class schedule</li>
  <li>View fee payment history</li>
  <li>View outstanding dues</li>
  <li>View notices and other relevant information</li>
</ul>

<h2>Fee and Commission Management</h2>

<p>
The system follows a subject-wise fee structure. Discounts can be applied to the original subject fee, after which the applicable commission percentage is used to determine the center's share and the teacher's share.
</p>

<p align="center">
  <strong>Original Subject Fee → Discount → Net Subject Fee → Commission → Center Share + Teacher Share</strong>
</p>

<p>
The commission percentage is configurable according to the arrangement between the coaching center and the teacher. It is not treated as a fixed percentage for every teacher.
</p>

<h2>Technology Stack</h2>

<table>
  <tr>
    <th>Part</th>
    <th>Technology</th>
  </tr>
  <tr>
    <td>Frontend</td>
    <td>React</td>
  </tr>
  <tr>
    <td>Backend</td>
    <td>Node.js, Express.js</td>
  </tr>
  <tr>
    <td>Database</td>
    <td>MongoDB</td>
  </tr>
  <tr>
    <td>API</td>
    <td>REST API</td>
  </tr>
  <tr>
    <td>Authentication</td>
    <td>JWT</td>
  </tr>
</table>

<h2>Project Structure</h2>

<pre>
SCMS/
├── client/        # React frontend
├── server/        # Node.js and Express backend
├── README.md
└── .gitignore
</pre>

<h2>Getting Started</h2>

<h3>1. Clone the repository</h3>

<pre>
git clone https://github.com/anilroyin/SCMS.git
cd SCMS
</pre>

<h3>2. Install dependencies</h3>

<p>
Install the dependencies separately for the frontend and backend.
</p>

<pre>
cd server
npm install

cd ../client
npm install
</pre>

<h3>3. Environment Variables</h3>

<p>
The backend uses environment variables for configuration such as the MongoDB connection string and authentication-related settings.
</p>

<p>
Create a <code>.env</code> file inside the <code>server</code> directory and add the required values.
</p>

<pre>
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
</pre>

<p>
The actual environment file should not be committed to GitHub.
</p>

<h3>4. Run the Project</h3>

<p>
Start the backend:
</p>

<pre>
cd server
npm run dev
</pre>

<p>
Then start the frontend in a separate terminal:
</p>

<pre>
cd client
npm run dev
</pre>

<h2>Development Approach</h2>

<p>
The project is being developed incrementally. Each major module is developed, connected with the frontend and backend, tested, and then refined before moving to the next part of the system.
</p>

<p>
The development focuses on keeping the application understandable and maintainable while representing the actual management processes of a coaching center.
</p>

<h2>Project Status</h2>

<p>
<strong>Development in progress.</strong>
</p>

<p>
The system is being developed as a BCA major project and will be tested using realistic coaching-center data and scenarios.
</p>

<h2>Academic Project</h2>

<table>
  <tr>
    <td><strong>Project</strong></td>
    <td>Smart Coaching Management System</td>
  </tr>
  <tr>
    <td><strong>Degree</strong></td>
    <td>Bachelor of Computer Applications (BCA)</td>
  </tr>
  <tr>
    <td><strong>University</strong></td>
    <td>Amity University Online</td>
  </tr>
  <tr>
    <td><strong>Academic Year</strong></td>
    <td>2026</td>
  </tr>
</table>

<h2>Author</h2>

<p>
<strong>Anil Roy</strong><br>
BCA Student, Amity University Online
</p>

<hr>

<p align="center">
  Smart Coaching Management System (SCMS)
</p>
