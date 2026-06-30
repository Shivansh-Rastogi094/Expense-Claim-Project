import React from "react";
import { NavLink } from "react-router-dom";

export default function SideNavBar({ role, setRole }) {
  const isManager = role === "MANAGER";

  return (
    <nav className="fixed left-0 top-0 h-full w-64 border-r border-border-subtle bg-surface-container-low transition-all duration-200 ease-in-out z-50 flex flex-col py-6 px-4">
      {/* Brand & Role Switcher */}
      <div className="mb-8 px-2 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-lg font-headline-sm">
            EF
          </div>
          <div>
            <h1 class="font-headline-md text-headline-md font-bold text-primary leading-tight">ExpenseFlow</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant leading-tight">Finance Dept</p>
          </div>
        </div>

        {/* Premium Role Switcher Pill */}
        <div className="bg-surface-container-high p-1 rounded-full flex items-center relative shadow-inner mt-2">
          <button
            onClick={() => setRole("EMPLOYEE")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              role === "EMPLOYEE"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Employee
          </button>
          <button
            onClick={() => setRole("MANAGER")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              role === "MANAGER"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Manager
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1 flex-grow font-body-md text-body-md">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>
                  add_circle
                </span>
                <span>Submit Claim</span>
              </>
            )}
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/claims"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>
                  list_alt
                </span>
                <span>All Claims</span>
              </>
            )}
          </NavLink>
        </li>

        {/* Manager Only: Review Claims */}
        {isManager && (
          <li>
            <NavLink
              to="/review"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>
                    fact_check
                  </span>
                  <span>Review Claims</span>
                </>
              )}
            </NavLink>
          </li>
        )}

        {/* Manager Only: Budgets */}
        {isManager && (
          <li>
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>
                    account_balance_wallet
                  </span>
                  <span>Budgets</span>
                </>
              )}
            </NavLink>
          </li>
        )}

        <li>
          <NavLink
            to="/summary"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>
                  calendar_month
                </span>
                <span>Monthly Summary</span>
              </>
            )}
          </NavLink>
        </li>
      </ul>

      {/* Profile Footer */}
      <div className="mt-auto pt-6 border-t border-border-subtle flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0">
          {isManager ? "M" : "E"}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-md text-label-md font-bold text-primary truncate">
            {isManager ? "Finance Admin" : "Employee User"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
            {isManager ? "Finance Manager" : "Employee"}
          </span>
        </div>
      </div>
    </nav>
  );
}
