import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/dashboard"
import Login from "./pages/login"
import Students from "./pages/students"
import AdmitStudent from "./pages/admitStudent"
import StudentDetails from "./pages/studentDetails"
import Teachers from "./pages/teachers"
import AddTeacher from "./pages/addTeacher"
import TeacherDetails from "./pages/teacherDetails"
import EditTeacher from "./pages/editTeacher"
import Subjects from "./pages/subjects"
import AddSubject from "./pages/addSubject"
import SubjectDetails from "./pages/subjectDetails"
import EditSubject from "./pages/editSubject"
import Fees from "./pages/fees"
import StudentFeeDetails from "./pages/studentFeeDetails"
import TeacherPayments from "./pages/teacherPayments"
import TeacherPaymentDetails from "./pages/teacherPaymentDetails"
import Schedule from "./pages/schedule"
import AddSchedule from "./pages/addSchedule"
import EditSchedule from "./pages/editSchedule"
import TeacherEarnings from "./pages/teacherEarnings"
import Notifications from "./pages/Notifications"
import SendNotification from "./pages/sendNotification"
import ProtectedRoute from "./components/protectedRoute"
import Reports from "./pages/reports"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/admit"
          element={
            <ProtectedRoute>
              <AdmitStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:id"
          element={
            <ProtectedRoute>
              <StudentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Teachers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers/add"
          element={
            <ProtectedRoute>
              <AddTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers/:id"
          element={
            <ProtectedRoute>
              <TeacherDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute>
              <TeacherDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers/:id/edit"
          element={
            <ProtectedRoute>
              <EditTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects/add"
          element={
            <ProtectedRoute>
              <AddSubject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects/:id"
          element={
            <ProtectedRoute>
              <SubjectDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects/:id/edit"
          element={
            <ProtectedRoute>
              <EditSubject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fees"
          element={
            <ProtectedRoute>
              <Fees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fees/student/:studentId"
          element={
            <ProtectedRoute>
              <StudentFeeDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/fees"
          element={
            <ProtectedRoute>
              <StudentFeeDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-payments"
          element={
            <ProtectedRoute>
              <TeacherPayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-payments/:teacherId"
          element={
            <ProtectedRoute>
              <TeacherPaymentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule/add"
          element={
            <ProtectedRoute>
              <AddSchedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule/:id/edit"
          element={
            <ProtectedRoute>
              <EditSchedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/earnings"
          element={
            <ProtectedRoute>
              <TeacherEarnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute>
              <StudentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications/send"
          element={
            <ProtectedRoute>
              <SendNotification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
         <ProtectedRoute>
         <Reports />
         </ProtectedRoute>
         }
        />
    </Routes>
      </BrowserRouter>
  )
}

export default App