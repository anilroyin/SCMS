
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  BarChart3,
  Receipt,
  Bell,
  HandCoins,
  Headset, 
  ChevronLeft
} from "lucide-react"
import "./aboutSCMS.css"

function AboutSCMS() {
  return (
    <main className="about-scms-page">
      <div className="about-scms-content">
        <div className="about-scms-header">
          <div>
            <h1>About SCMS</h1>
            <p>Learn more about the Smart Coaching Management System.</p>
          </div>
          <Link to="/login" className="about-scms-back">
            <ChevronLeft size={18} />
            Back
          </Link>
        </div>

        <section className="about-scms-card">
          <div className="about-scms-title">
            <GraduationCap size={30} />
            <div>
              <h2>Smart Coaching Management System</h2>
              <p>Making coaching centre management simpler and more organised.</p>
            </div>
          </div>
          <p>
           Smart Coaching Management System (SCMS) is a web-based application designed 
           to manage and organise the daily operations of a coaching centre. It provides 
           a centralised platform for handling essential administrative tasks.
          </p>
          <p>
           The system includes student and teacher management, class scheduling, fee collection, 
           receipt generation, teacher payments, notifications, help and support, and financial
           reporting. It helps reduce manual paperwork and makes coaching centre records easier
           to maintain.
          </p>
        </section>

        <section className="about-scms-section">
          <h2>Key Features</h2>
          <div className="about-scms-features">
            <article className="about-scms-feature">
              <Users size={23} />
              <h3>Manage Students</h3>
              <p>Student records and profiles</p>
            </article>

            <article className="about-scms-feature">
              <Users size={23} />
              <h3>Manage Teachers</h3>
              <p>Teacher profiles and assigned students</p>
            </article>

            <article className="about-scms-feature">
              <BookOpen size={23} />
              <h3>Organise Classes</h3>
              <p>Subjects and class schedules</p>
            </article>

            <article className="about-scms-feature">
              <Wallet size={23} />
              <h3>Track Fees</h3>
              <p>Fee collection, discounts and dues</p>
            </article>

            <article className="about-scms-feature">
              <Receipt size={23} />
              <h3>Generate Fee Receipts</h3>
              <p>Record and verify fee payments</p>
            </article>

            <article className="about-scms-feature">
              <HandCoins size={23} />
              <h3>Manage Teacher Payments</h3>
              <p>Commissions and teacher earnings</p>
            </article>

            <article className="about-scms-feature">
              <Headset size={23} />
              <h3>Chatbot Help &amp; Support</h3>
              <p>Assistance for students</p>
            </article>

            <article className="about-scms-feature">
              <BarChart3 size={23} />
              <h3>Reports &amp; Dashboard</h3>
              <p>Coaching and financial summaries</p>
            </article>

            <article className="about-scms-feature">
              <Bell size={23} />
              <h3>Notifications</h3>
              <p>Stay informed about important updates and activities.</p>
            </article>
          </div>
        </section>

        <section className="about-scms-card">
          <h2>Technology Stack</h2>
          <p>
            SCMS uses the MERN stack. MongoDB Atlas stores application data,
            Express.js and Node.js handle backend operations, and React
            provides the user interface.
          </p>
          <div className="about-scms-tech">
            <span>MongoDB Atlas</span>
            <span>Express.js</span>
            <span>React</span>
            <span>Node.js</span>
          </div>
        </section>

        <section className="about-scms-card">
          <div className="about-scms-title">
            <div>
              <h2>Frontend &amp; Build Tools</h2>
              <p>Tools and libraries used to build the user interface.</p>
            </div>
          </div>
          <div className="about-scms-tech">
            <span>Vite</span>
            <span>React Router</span>
            <span>Lucide React</span>
            <span>Recharts</span>
          </div>
        </section>

        <section className="about-scms-card">
          <div className="about-scms-title">
            <div>
              <h2>Backend Libraries &amp; Packages</h2>
              <p>Packages supporting database operations, authentication, and server functionality.</p>
            </div>
          </div>
          <div className="about-scms-tech">
            <span>Mongoose</span>
            <span>bcryptjs</span>
            <span>jsonwebtoken</span>
            <span>cors</span>
            <span>dotenv</span>
            <span>googleapis</span>
          </div>
        </section>

        <section className="about-scms-card">
          <div className="about-scms-title">
            <div>
              <h2>Email &amp; Security Integration</h2>
              <p>Supporting account security and password recovery.</p>
            </div>
          </div>
          <p>
            The Gmail API, accessed through OAuth 2.0, supports password-reset
            email delivery. bcryptjs is used for password hashing, while
            JSON Web Tokens support token-based authentication.
          </p>
          <div className="about-scms-tech">
            <span>Gmail API</span>
            <span>OAuth 2.0</span>
            <span>Password Hashing</span>
            <span>JWT Authentication</span>
          </div>
        </section>

        <section className="about-scms-card">
          <div className="about-scms-title">
            <div>
              <h2>Deployment &amp; Hosting</h2>
              <p>Services used to make SCMS accessible online.</p>
            </div>
          </div>
          <p>
            The frontend is hosted on Vercel, the backend runs on Render,
            and MongoDB Atlas provides the hosted database.
          </p>
          <div className="about-scms-tech">
            <span>Vercel</span>
            <span>Render</span>
            <span>MongoDB Atlas</span>
          </div>
          <p>
            Custom Domain:{" "}
            <a
              href="https://scms.anilroy.in"
              target="_blank"
              rel="noreferrer"
            >
              scms.anilroy.in
            </a>
          </p>
        </section>

        <section className="about-scms-card about-scms-academic">
          <div className="about-scms-title">
            <div>
              <h2>Academic Project</h2>
              <p>Final-Year Major Project | Amity University Online</p>
            </div>
          </div>
          <p>
            The Smart Coaching Management System (SCMS) was developed as a BCA final-year major 
            project to address real administrative challenges at a coaching centre. It provides 
            a centralised digital solution for managing students, teachers, fees, receipt generation,
            schedules, payments, and financial records and reports.
          </p>
        </section>

        <footer className="about-scms-footer">
          © 2026 SCMS. All rights reserved.
        </footer>
      </div>
    </main>
  )
}

export default AboutSCMS
