import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js";
import AttorneyShell from "./components/layout/AttorneyShell.js";
import AttorneyDashboardPage from "./pages/attorney/AttorneyDashboardPage.js";
import ReviewQueuePage from "./pages/attorney/ReviewQueuePage.js";
import StatutoryCorpusPage from "./pages/attorney/StatutoryCorpusPage.js";
import AttorneyAccountPage from "./pages/attorney/AttorneyAccountPage.js";

// Auth pages take onNavigateTo* callbacks rather than reading the router
// directly, so they stay simple/presentational and testable in isolation.
// This component is the only place those callbacks get wired to real URLs.
function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onNavigateToLogin={() => navigate("/login")}
            onNavigateToRegister={() => navigate("/register")}
          />
        }
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onNavigateToRegister={() => navigate("/register")}
            onNavigateToForgotPassword={() => navigate("/forgot-password")}
            onNavigateToLanding={() => navigate("/")}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onNavigateToLogin={() => navigate("/login")}
            onNavigateToLanding={() => navigate("/")}
          />
        }
      />
      <Route
        path="/forgot-password"
        element={
          <ForgotPasswordPage
            onNavigateToLogin={() => navigate("/login")}
            onNavigateToLanding={() => navigate("/")}
          />
        }
      />

      {/* Attorney dashboard — AttorneyShell renders the sidebar once and
          swaps the page body via <Outlet /> for each nested route below. */}
      <Route path="/attorney" element={<AttorneyShell />}>
        <Route index element={<AttorneyDashboardPage />} />
        <Route path="review-queue" element={<ReviewQueuePage />} />
        {/* Deep link into a specific contract's review, opened from the My contracts table. */}
        <Route path="review-queue/:contractId" element={<ReviewQueuePage />} />
        <Route path="statutory-corpus" element={<StatutoryCorpusPage />} />
        <Route path="account" element={<AttorneyAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
