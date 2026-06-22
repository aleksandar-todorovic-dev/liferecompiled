import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import OrientationGuard from "./components/common/OrientationGuard";
import ScrollToTop from "./components/ScrollToTop";
import Spinner from "./components/Spinner";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { routeLoaders } from "./routes/routePreloaders";

const AuthAction = lazy(routeLoaders.authAction);
const ForgotPassword = lazy(routeLoaders.forgotPassword);
const ReportIssue = lazy(routeLoaders.reportIssue);
const MyPosts = lazy(routeLoaders.myPosts);
const CreatePost = lazy(routeLoaders.createPost);
const EditPost = lazy(routeLoaders.editPost);
const PostDetails = lazy(routeLoaders.postDetails);
const Profile = lazy(routeLoaders.profile);
const About = lazy(routeLoaders.about);

const DashboardLayout = lazy(routeLoaders.dashboardLayout);
const SavedPosts = lazy(routeLoaders.savedPosts);
const Stats = lazy(routeLoaders.stats);
const Trash = lazy(routeLoaders.trash);
const Settings = lazy(routeLoaders.settings);
const ModerationPage = lazy(routeLoaders.moderationPage);

const routeFallback = (
  <div className="flex min-h-[45vh] items-center justify-center">
    <Spinner message="Loading..." />
  </div>
);

/**
 * @component App
 *
 * Top-level router + global providers mounted once for the whole app.
 *
 * Why:
 * - Keeps shared shell (`Layout`) and global guards (`OrientationGuard`) consistent across routes.
 * - Centralizes route access control via `ProtectedRoute` (dashboard + user-only pages).
 * - Mounts a single `ToastContainer` to avoid duplicate containers and inconsistent toast behavior.
 *
 * Routing notes:
 * - Public routes: home, auth pages, post details, about, support/report.
 * - Protected routes: dashboard subtree + current-user profile.
 * - Fallback route redirects unknown paths to `/login` to keep the entry flow predictable.
 *
 * Toast notes:
 * - `limit={2}` + `newestOnTop` reduces toast spam during rapid actions.
 * - Higher `zIndex` ensures toasts stay above modals/sheets.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <Layout>
      <OrientationGuard />
      <ScrollToTop />

      <Suspense fallback={routeFallback}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/action" element={<AuthAction />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/post/:postId" element={<PostDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/report" element={<ReportIssue />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/*" element={<DashboardLayout />}>
              <Route index element={<MyPosts />} />
              <Route path="saved" element={<SavedPosts />} />
              <Route path="stats" element={<Stats />} />
              <Route path="trash" element={<Trash />} />
              <Route path="create" element={<CreatePost />} />
              <Route path="edit/:postId" element={<EditPost />} />
              <Route path="moderation" element={<ModerationPage />} />
            </Route>

            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Public profile route (view other users) */}
          <Route path="/profile/:uid" element={<Profile />} />

          {/* Unknown routes -> auth entry */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-center"
        theme="dark"
        newestOnTop
        limit={2}
        draggable={false}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        style={{ zIndex: 120 }}
      />
    </Layout>
  );
}

export default App;
