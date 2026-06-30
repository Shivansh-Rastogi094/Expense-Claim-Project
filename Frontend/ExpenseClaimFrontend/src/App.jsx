import React, { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import SideNavBar from "./components/SideNavBar";
import TopAppBar from "./components/TopAppBar";
import SubmitClaimPage from "./pages/SubmitClaimPage";
import ClaimsPage from "./pages/ClaimsPage";
import ReviewPage from "./pages/ReviewPage";
import BudgetsPage from "./pages/BudgetsPage";
import SummaryPage from "./pages/SummaryPage";

function App() {
  const [role, setRole] = useState("EMPLOYEE"); // "EMPLOYEE" or "MANAGER"
  const location = useLocation();

  // Helper to determine the header title based on the active path
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Submit Expense Claim";
      case "/claims":
        return "All Claims History";
      case "/review":
        return "Pending Expense Reviews";
      case "/budgets":
        return "Budget Management";
      case "/summary":
        return "Monthly Finance Summary";
      default:
        return "ExpenseFlow";
    }
  };

  const isManager = role === "MANAGER";

  return (
    <div className="bg-background text-on-surface min-h-screen flex antialiased">
      {/* Sidebar Navigation */}
      <SideNavBar role={role} setRole={setRole} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <TopAppBar title={getHeaderTitle()} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-margin-page bg-surface-muted overflow-y-auto">
          <Routes>
            <Route path="/" element={<SubmitClaimPage />} />
            <Route path="/claims" element={<ClaimsPage />} />
            
            {/* Manager Only Routes with Redirect Guards */}
            <Route
              path="/review"
              element={isManager ? <ReviewPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/budgets"
              element={isManager ? <BudgetsPage /> : <Navigate to="/" replace />}
            />

            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
