import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/dashboard"
import Login from "./pages/login"
import Students from "./pages/students"
import AdmitStudent from "./pages/admitStudent"
import StudentDetails from "./pages/studentDetails"
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

      </Routes>
    </BrowserRouter>
  )
}

export default App