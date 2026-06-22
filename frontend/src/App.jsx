import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider }        from "./contexts/ThemeContext.jsx";
import { ToastProvider }        from "./contexts/ToastContext.jsx";
import { AuthProvider }         from "./contexts/AuthContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import ProtectedRoute           from "./components/ProtectedRoute.jsx";
import Login                    from "./pages/Login.jsx";
import Register                 from "./pages/Register.jsx";
import Dashboard                from "./pages/Dashboard.jsx";
import Records                  from "./pages/Records.jsx";
import Upload                   from "./pages/Upload.jsx";
import RecordDetail             from "./pages/RecordDetail.jsx";
import EmergencyManagement      from "./pages/EmergencyManagement.jsx";
import EmergencyPublic          from "./pages/EmergencyPublic.jsx";
import PendingVerification      from "./pages/PendingVerification.jsx";
import Settings                 from "./pages/Settings.jsx";
import Timeline                 from "./pages/Timeline.jsx";
import Appointments             from "./pages/Appointments.jsx";
import Medications              from "./pages/Medications.jsx";
import Search                   from "./pages/Search.jsx";
import AIAssistant              from "./pages/AIAssistant.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/login"            element={<Login />} />
                <Route path="/register"         element={<Register />} />
                <Route path="/emergency/:token" element={<EmergencyPublic />} />

                <Route path="/dashboard"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/records"              element={<ProtectedRoute><Records /></ProtectedRoute>} />
                <Route path="/records/upload"       element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/records/:id"          element={<ProtectedRoute><RecordDetail /></ProtectedRoute>} />
                <Route path="/emergency/manage"     element={<ProtectedRoute><EmergencyManagement /></ProtectedRoute>} />
                <Route path="/pending-verification" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />
                <Route path="/settings"             element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/timeline"             element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
                <Route path="/appointments"         element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/medications"          element={<ProtectedRoute><Medications /></ProtectedRoute>} />
                <Route path="/search"               element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/ai"                   element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}