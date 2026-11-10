import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../../layouts/public/PublicLayout';
import { UserLayout } from '../../layouts/user/UserLayout';
import { AdminLayout } from '../../layouts/admin/AdminLayout';
import { IntelligenceLayout } from '../../layouts/intelligence/IntelligenceLayout';

// Public Pages
import { HomePage } from '../../pages/public/HomePage';
import { PublicMapPage } from '../../pages/public/PublicMapPage';
import { PublicDisastersPage } from '../../pages/public/PublicDisastersPage';
import { PublicWarningsPage } from '../../pages/public/PublicWarningsPage';
import { PublicPreparednessPage } from '../../pages/public/PublicPreparednessPage';
import { PublicEducationPage } from '../../pages/public/PublicEducationPage';
import { PublicAboutPage } from '../../pages/public/PublicAboutPage';
import { LoginPage } from '../../pages/public/LoginPage';
import { RegisterPage } from '../../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../../pages/public/ForgotPasswordPage';
import { NotFoundPage } from '../../pages/public/NotFoundPage';

// User Portal Pages
import { UserDashboardPage } from '../../pages/user/UserDashboardPage';
import { UserReportsPage } from '../../pages/user/UserReportsPage';
import { UserCreateReportPage } from '../../pages/user/UserCreateReportPage';
import { UserRegionsPage } from '../../pages/user/UserRegionsPage';
import { UserNotificationsPage } from '../../pages/user/UserNotificationsPage';
import { UserSettingsPage } from '../../pages/user/UserSettingsPage';

// Admin Dashboard Pages
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../../pages/admin/AdminUsersPage';
import { AdminReportsPage } from '../../pages/admin/AdminReportsPage';
import { AdminDisastersPage } from '../../pages/admin/AdminDisastersPage';
import { AdminAlertsPage } from '../../pages/admin/AdminAlertsPage';
import { AdminEducationPage } from '../../pages/admin/AdminEducationPage';
import { AdminDataSourcesPage } from '../../pages/admin/AdminDataSourcesPage';
import { AdminAuditLogsPage } from '../../pages/admin/AdminAuditLogsPage';

// Intelligence Center Pages
import { IntelligenceOverviewPage } from '../../pages/intelligence/IntelligenceOverviewPage';
import { IntelligenceMapPage } from '../../pages/intelligence/IntelligenceMapPage';
import { IntelligenceRiskAnalysisPage } from '../../pages/intelligence/IntelligenceRiskAnalysisPage';
import { IntelligenceAiInsightsPage } from '../../pages/intelligence/IntelligenceAiInsightsPage';
import { IntelligenceDataSourcesPage } from '../../pages/intelligence/IntelligenceDataSourcesPage';
import { IntelligenceEventsPage } from '../../pages/intelligence/IntelligenceEventsPage';
import { IntelligenceAlertOperationsPage } from '../../pages/intelligence/IntelligenceAlertOperationsPage';

export const router = createBrowserRouter([
  // Area A: Public Website
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map', element: <PublicMapPage /> },
      { path: 'disasters', element: <PublicDisastersPage /> },
      { path: 'warnings', element: <PublicWarningsPage /> },
      { path: 'preparedness', element: <PublicPreparednessPage /> },
      { path: 'education', element: <PublicEducationPage /> },
      { path: 'about', element: <PublicAboutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Area B: User Portal
  {
    path: '/user',
    element: <UserLayout />,
    children: [
      { index: true, element: <UserDashboardPage /> },
      { path: 'dashboard', element: <UserDashboardPage /> },
      { path: 'reports', element: <UserReportsPage /> },
      { path: 'reports/create', element: <UserCreateReportPage /> },
      { path: 'regions', element: <UserRegionsPage /> },
      { path: 'notifications', element: <UserNotificationsPage /> },
      { path: 'settings', element: <UserSettingsPage /> },
    ],
  },

  // Area C: Admin Dashboard
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'disasters', element: <AdminDisastersPage /> },
      { path: 'alerts', element: <AdminAlertsPage /> },
      { path: 'education', element: <AdminEducationPage /> },
      { path: 'data-sources', element: <AdminDataSourcesPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    ],
  },

  // Area D: Intelligence Center
  {
    path: '/intelligence-center',
    element: <IntelligenceLayout />,
    children: [
      { index: true, element: <IntelligenceOverviewPage /> },
      { path: 'overview', element: <IntelligenceOverviewPage /> },
      { path: 'map', element: <IntelligenceMapPage /> },
      { path: 'risk-analysis', element: <IntelligenceRiskAnalysisPage /> },
      { path: 'ai-insights', element: <IntelligenceAiInsightsPage /> },
      { path: 'data-sources', element: <IntelligenceDataSourcesPage /> },
      { path: 'events', element: <IntelligenceEventsPage /> },
      { path: 'alert-operations', element: <IntelligenceAlertOperationsPage /> },
    ],
  },
]);
