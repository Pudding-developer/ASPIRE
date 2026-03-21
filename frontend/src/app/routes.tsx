import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import InstructorDashboard from "./pages/InstructorDashboard";
import LoginPage from "./pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/instructor",
    Component: InstructorDashboard,
  },
]);
