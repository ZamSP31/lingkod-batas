import { useState } from "react";
import LandingPage from "./pages/LandingPage.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js";

type View = "landing" | "login" | "register" | "forgot-password";

function App() {
  // A lightweight view toggle for now — swap this for react-router once
  // more screens (dashboards, contract review, etc.) exist and URLs
  // need to be shareable/bookmarkable.
  const [view, setView] = useState<View>("landing");
  const goToLanding = () => setView("landing");

  if (view === "login") {
    return (
      <LoginPage
        onNavigateToRegister={() => setView("register")}
        onNavigateToForgotPassword={() => setView("forgot-password")}
        onNavigateToLanding={goToLanding}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterPage
        onNavigateToLogin={() => setView("login")}
        onNavigateToLanding={goToLanding}
      />
    );
  }

  if (view === "forgot-password") {
    return (
      <ForgotPasswordPage
        onNavigateToLogin={() => setView("login")}
        onNavigateToLanding={goToLanding}
      />
    );
  }

  return (
    <LandingPage
      onNavigateToLogin={() => setView("login")}
      onNavigateToRegister={() => setView("register")}
    />
  );
}

export default App;
