import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { LiveChat } from "./pages/LiveChat";
import { AutomationBuilder } from "./pages/AutomationBuilder";
import { AITraining } from "./pages/AITraining";
import { LeadManagement } from "./pages/LeadManagement";
import { Analytics } from "./pages/Analytics";
import { Connection } from "./pages/Connection";
import { AISetup } from "./pages/AISetup";
import { AIReady } from "./pages/AIReady";
import { AIKnowledge } from "./pages/AIKnowledge";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/ai-setup",
    Component: AISetup,
  },
  {
    path: "/ai-ready",
    Component: AIReady,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "chat", Component: LiveChat },
      { path: "automation", Component: AutomationBuilder },
      { path: "training", Component: AITraining },
      { path: "ai-knowledge", Component: AIKnowledge },
      { path: "leads", Component: LeadManagement },
      { path: "analytics", Component: Analytics },
      { path: "connection", Component: Connection },
    ],
  },
]);
