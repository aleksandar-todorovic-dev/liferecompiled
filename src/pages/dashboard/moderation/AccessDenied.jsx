import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";

/**
 * @component AccessDenied
 *
 * Simple guard-screen for admin-only routes.
 *
 * Behavior:
 * - Renders a short explanation and a single escape hatch back to `/dashboard`.
 * - Keeps logic minimal so route guards can stay consistent elsewhere (no auth checks here).
 *
 * @returns {JSX.Element}
 */
const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="py-2">
      <EmptyState
        title="Access restricted"
        description="This area is only available to moderators or admins."
        actionLabel="Back to dashboard"
        onAction={() => navigate("/dashboard")}
      />
    </div>
  );
};

export default AccessDenied;
