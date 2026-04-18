import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';

const Layout = lazy(() =>
  import('./components/Layout').then((module) => ({ default: module.Layout })),
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const LiveChat = lazy(() =>
  import('./pages/LiveChat').then((module) => ({ default: module.LiveChat })),
);
const AutomationBuilder = lazy(() =>
  import('./pages/AutomationBuilder').then((module) => ({
    default: module.AutomationBuilder,
  })),
);
const AITraining = lazy(() =>
  import('./pages/AITraining').then((module) => ({ default: module.AITraining })),
);
const LeadManagement = lazy(() =>
  import('./pages/LeadManagement').then((module) => ({
    default: module.LeadManagement,
  })),
);
const Analytics = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics })),
);
const Connection = lazy(() =>
  import('./pages/Connection').then((module) => ({ default: module.Connection })),
);
const AISetup = lazy(() =>
  import('./pages/AISetup').then((module) => ({ default: module.AISetup })),
);
const AIReady = lazy(() =>
  import('./pages/AIReady').then((module) => ({ default: module.AIReady })),
);
const AIKnowledge = lazy(() =>
  import('./pages/AIKnowledge').then((module) => ({
    default: module.AIKnowledge,
  })),
);
const WebhookTest = lazy(() =>
  import('./pages/WebhookTest').then((module) => ({
    default: module.WebhookTest,
  })),
);
const Login = lazy(() =>
  import('./pages/Login').then((module) => ({ default: module.Login })),
);

function RouteFallback() {
  return (
    <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  );
}

function Suspended({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspended>
        <Login />
      </Suspended>
    ),
  },
  {
    path: '/ai-setup',
    element: (
      <ProtectedRoute>
        <Suspended>
          <AISetup />
        </Suspended>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai-ready',
    element: (
      <ProtectedRoute>
        <Suspended>
          <AIReady />
        </Suspended>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspended>
          <Layout />
        </Suspended>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspended>
            <Dashboard />
          </Suspended>
        ),
      },
      {
        path: 'chat',
        element: (
          <Suspended>
            <LiveChat />
          </Suspended>
        ),
      },
      {
        path: 'automation',
        element: (
          <Suspended>
            <AutomationBuilder />
          </Suspended>
        ),
      },
      {
        path: 'training',
        element: (
          <Suspended>
            <AITraining />
          </Suspended>
        ),
      },
      {
        path: 'ai-knowledge',
        element: (
          <Suspended>
            <AIKnowledge />
          </Suspended>
        ),
      },
      {
        path: 'leads',
        element: (
          <Suspended>
            <LeadManagement />
          </Suspended>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspended>
            <Analytics />
          </Suspended>
        ),
      },
      {
        path: 'connection',
        element: (
          <Suspended>
            <Connection />
          </Suspended>
        ),
      },
      {
        path: 'webhook-test',
        element: (
          <Suspended>
            <WebhookTest />
          </Suspended>
        ),
      },
    ],
  },
]);
