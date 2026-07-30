import { useState } from "react";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js";

type View = "login" | "register" | "forgot-password";

function App() {
  // A lightweight view toggle for now — swap this for react-router once
  // more screens (dashboards, contract review, etc.) exist and URLs
  // need to be shareable/bookmarkable.
  const [view, setView] = useState<View>("login");

  if (view === "register") {
    return <RegisterPage onNavigateToLogin={() => setView("login")} />;
  }

  if (view === "forgot-password") {
    return <ForgotPasswordPage onNavigateToLogin={() => setView("login")} />;
  }

  return (
    <LoginPage
      onNavigateToRegister={() => setView("register")}
      onNavigateToForgotPassword={() => setView("forgot-password")}
    />
  );
}

export default App;
