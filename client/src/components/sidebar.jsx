import { NavLink } from "react-router-dom"

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>SCMS</h2>
        <p>Smart Coaching Management System</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/students">Students</NavLink>
        <NavLink to="/teachers">Teachers</NavLink>
        <NavLink to="/subjects">Subjects</NavLink>
        <NavLink to="/fees">Fees</NavLink>
        <NavLink to="/payments">Payments</NavLink>
        <NavLink to="/schedule">Schedule</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar