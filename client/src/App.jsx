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
import ProtectedRoute from "./components/protectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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
           path="/teachers/:id/edit"
           element={
          <ProtectedRoute>
          <EditTeacher />
          </ProtectedRoute>
          }
       />

      </Routes>
    </BrowserRouter>
  )
}

export default App