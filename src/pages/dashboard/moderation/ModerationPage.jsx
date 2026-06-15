import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import AccessDenied from "./AccessDenied";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase";
import { showErrorToast } from "../../../utils/toastUtils";
import SkeletonCard from "../../../components/ui/skeletonLoader/SkeletonCard";
import { openReportTarget } from "../../../utils/moderationUtils";
import Spinner from "../../../components/Spinner";
import EmptyState from "../components/EmptyState";

/**
 * @component ModerationPage
 *
 * Admin-only moderation dashboard for viewing recent user reports.
 *
 * Data behavior:
 * - Loads up to 100 most recent docs from `reports`, ordered by `createdAt desc`.
 * - Access is gated by `user.isAdmin` (UI guard); Firestore rules should enforce this too.
 *
 * UX behavior:
 * - Shows lightweight permission state while auth is being checked.
 * - Uses skeleton cards during initial reports fetch.
 * - On fetch failure, shows a single toast + inline error (no repeated stacking).
 *
 * @returns {JSX.Element}
 */
const ModerationPage = () => {
  const { user, isCheckingAuth } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Guard: only fetch after auth check completes and user is admin.
    if (isCheckingAuth || !user?.isAdmin) {
      return;
    }

    const fetchReports = async () => {
      try {
        setIsLoadingReports(true);
        setError(null);

        // Simple capped list to keep moderation UI fast and predictable.
        const q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc"),
          limit(100),
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setReports(data);
      } catch (err) {
        console.error("Failed to load reports:", err);

        // Keep user feedback actionable; toastId de-dupes if the effect retriggers.
        setError("Failed to load reports. Please try again.");
        showErrorToast("Failed to load reports. Please try again.");
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchReports();
  }, [user, isCheckingAuth]);

  const handleOpenTarget = (report) => {
    // Centralized navigation logic keeps target routing consistent for different report types.
    openReportTarget({ report, navigate });
  };

  if (isCheckingAuth) {
    return <Spinner message="Checking permissions..." />;
  }

  if (!user?.isAdmin) {
    return <AccessDenied />;
  }

  if (isLoadingReports) {
    return (
      <section className="space-y-4 py-2">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-100">Moderation</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Reviewing recent community reports.
          </p>
        </header>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4 py-2">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-100">Moderation</h1>
        </header>
        <EmptyState
          title="Reports could not be loaded"
          description={error}
        />
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="space-y-4 py-2">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-100">Moderation</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Recent reports from posts and comments appear here.
          </p>
        </header>
        <EmptyState
          title="No reports yet"
          description="There are no community reports waiting for review."
        />
      </section>
    );
  }

  return (
    <section className="space-y-4 py-2">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Moderation</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Recent reports from posts and comments.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-zinc-900/70 text-zinc-300">
            <tr className="border-b border-zinc-800">
              <th className="px-3 py-3 font-medium">Created at</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Target ID</th>
              <th className="px-3 py-3 font-medium">Reported by</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-3 py-3">
                  {report.createdAt?.toDate
                    ? report.createdAt.toDate().toLocaleString()
                    : "-"}
                </td>
                <td className="px-3 py-3">{report.type}</td>
                <td className="px-3 py-3">{report.targetId}</td>
                <td className="px-3 py-3">{report.reportedBy}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => handleOpenTarget(report)}
                    className="font-medium text-sky-300 hover:text-sky-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Open target
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ModerationPage;
