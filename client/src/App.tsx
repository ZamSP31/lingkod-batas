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
import UploadContractPage from "./pages/attorney/UploadContractPage.js";
import AddStatutorySourcePage from "./pages/attorney/AddStatutorySourcePage.js";
import ClientShell from "./components/layout/ClientShell.js";
import ClientDashboardPage from "./pages/client/ClientDashboardPage.js";
import TrackStatusPage from "./pages/client/TrackStatusPage.js";
import ClientAccountPage from "./pages/client/ClientAccountPage.js";
import SubmitContractPage from "./pages/client/SubmitContractPage.js";

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
        <Route path="upload-contract" element={<UploadContractPage />} />
        <Route path="review-queue" element={<ReviewQueuePage />} />
        <Route path="review-queue/:contractId" element={<ReviewQueuePage />} />
        <Route path="statutory-corpus" element={<StatutoryCorpusPage />} />
        <Route path="account" element={<AttorneyAccountPage />} />
        <Route
          path="statutory-corpus/add-source"
          element={<AddStatutorySourcePage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/client" element={<ClientShell />}>
        <Route index element={<ClientDashboardPage />} />
        <Route path="submit-contract" element={<SubmitContractPage />} />
        <Route path="track-status" element={<TrackStatusPage />} />
        <Route path="track-status/:contractId" element={<TrackStatusPage />} />
        <Route path="account" element={<ClientAccountPage />} />
      </Route>
    </Routes>
  );
}

export default App;
