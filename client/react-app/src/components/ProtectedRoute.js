import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("jwt");
  const email = sessionStorage.getItem("email");
  const allowedEmails = ["fox78907864@gmail.com"];

  if (!token || !allowedEmails.includes(email)) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
