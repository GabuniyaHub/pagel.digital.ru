  import React, { useState } from "react";
  import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
  import Login from "./pages/login";
  import Dashboard from "./pages/Dashboard";
  import ProtectedRoute from "./components/ProtectedRoute";

  function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("jwt"));

    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    );
  }

  export default App;
