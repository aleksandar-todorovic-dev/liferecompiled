import PropTypes from "prop-types";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  CARD_BASE,
  CARD_HOVER,
  FOCUS_RING,
  PILL_CATEGORY,
  PILL_TAG,
  PILL_META,
  cx,
} from "../constants/uiClasses";
import {
  getRouteIntentProps,
  preloadRoutes,
} from "../routes/routePreloaders";

const MAX_TAGS_IN_APP = 5; // UI limit: keep card compact and tag rail readable (avoid noisy overflow)

/**
 * Normalize tag input into a consistent display form.
 * - Trims whitespace
 * - Strips leading "#" to support legacy/user-entered formats
 * - Returns empty string for invalid/blank values
 *
 * @param {unknown} t
 * @returns {string}
 */
const normalizeTagText = (t) => {
  const raw = String(t ?? "").trim();
  if (!raw) return "";
  return raw.replace(/^#+/, "").trim();
};

/**
 * @component TopPostCard
 *
 * Compact preview card used in "Top posts" style lists.
 *
 * Key behaviors:
 * - Click + keyboard (Enter/Space) navigates to the post details route.
 * - Preview text prefers `description`, falls back to trimmed `content` (clamped) or a safe placeholder.
 * - Tags are normalized and deduped (case-insensitive), then capped to `MAX_TAGS_IN_APP` for UI stability.
 * - Tag rail supports horizontal scroll without triggering card navigation via stopPropagation.
 *
 * @param {{ post: { id: string, title?: string, description?: string, content?: string, category?: string, tags?: any[], reactionsCount?: number } }} props
 * @returns {JSX.Element}
 */
function TopPostCard({ post }) {
  const navigate = useNavigate();

  // Keep navigation behavior centralized (click + keyboard) for consistent routing.
  const goToPost = () => navigate(`/post/${post.id}`);

  const previewText = useMemo(() => {
    // Prefer curated summary when available; fallback keeps the card useful for older posts.
    const desc = post?.description?.trim();
    if (desc) return desc;

    const content = (post?.content ?? "").trim();
    if (!content) return "No description";

    // Clamp long content to avoid tall cards and uneven grids.
    return content.length > 160 ? content.slice(0, 160) + "..." : content;
  }, [post?.description, post?.content]);

  const category = (post?.category || "Uncategorized").trim();
  const reactionsTotal = post?.reactionsCount ?? 0;

  const allTags = useMemo(() => {
    // Defensive: tags may be missing or stored in mixed shapes depending on older data.
    const raw = Array.isArray(post?.tags) ? post.tags : [];

    // Normalize to plain text, then remove empties.
    const normalized = raw
      .map((t) => (typeof t === "string" ? t : (t?.text ?? t?.name ?? "")))
      .map((t) => normalizeTagText(t))
      .filter(Boolean);

    // Case-insensitive dedupe keeps UI tidy even if backend data is inconsistent.
    const seen = new Set();
    const unique = [];

    for (const t of normalized) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(t);

      // Hard cap: prevents horizontal rail from becoming unwieldy on small screens.
      if (unique.length >= MAX_TAGS_IN_APP) break;
    }

    return unique;
  }, [post?.tags]);

  const pillCategory = cx(
    PILL_CATEGORY,
    "text-[11px] px-2.5 py-1 font-medium max-w-full",
  );

  const tagPill = cx(
    PILL_TAG,
    "text-[11px] px-2.5 py-1 font-medium",
    "shrink-0 whitespace-nowrap max-w-none overflow-visible text-clip",
  );

  const reactionsPill = cx(
    PILL_META,
    "inline-flex items-center justify-center flex-none",
    "min-w-[2.25rem]",
    "text-[12px] px-2.5 py-1 tabular-nums",
  );

  const noTagsPill = cx(
    PILL_META,
    "inline-flex items-center flex-none",
    "text-[11px] px-2.5 py-1 font-medium text-zinc-500",
  );

  // Tag rail is interactive (scroll/touch). Stop bubbling so it does not trigger card navigation.
  const stop = (e) => e.stopPropagation();

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToPost}
      {...getRouteIntentProps(preloadRoutes.postDetails)}
      onKeyDown={(e) => {
        // Keyboard parity: card behaves like a button for accessibility.
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToPost();
        }
      }}
      className={cx(
        CARD_BASE,
        CARD_HOVER,
        "group text-left cursor-pointer",
        "relative overflow-hidden",
        "border border-zinc-800 bg-zinc-950 shadow-sm",
        "hover:border-zinc-700 hover:bg-zinc-950/90",
        "h-auto lg:h-full",
        FOCUS_RING,
      )}
      aria-label={`Open post: ${post?.title ?? "Untitled"}`}
    >
      <div className="flex min-w-0 flex-col lg:h-full">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={reactionsPill} title="Total reactions">
              {reactionsTotal}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Reactions
            </span>
          </div>

          <h3
            className={cx(
              "min-w-0 text-base font-semibold text-zinc-100",
              "line-clamp-2",
              "[overflow-wrap:anywhere]",
            )}
            title={post?.title ?? "Untitled"}
          >
            {post?.title ?? "Untitled"}
          </h3>

          <p
            className={cx(
              "mt-2 min-w-0 text-sm text-zinc-300",
              "line-clamp-3",
              "[overflow-wrap:anywhere]",
            )}
          >
            {previewText}
          </p>
        </div>

        <div className="mt-auto pt-4 min-w-0">
          {/* Row 1: category */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className={pillCategory} title={category}>
              {category}
            </span>
          </div>

          {/* Row 2: tag rail (horizontal scroll) */}
          <div
            className="mt-2 min-h-[2.25rem] min-w-0"
            onClick={stop}
            onPointerDown={stop}
            onTouchStart={stop}
          >
            <div className="relative">
              <div
                className={
                  "tag-rail flex items-center gap-2 flex-nowrap w-full " +
                  "overflow-x-auto overflow-y-hidden overscroll-x-contain " +
                  "pr-10 pb-3 touch-pan-x [-webkit-overflow-scrolling:touch]"
                }
              >
                {allTags.length > 0 ? (
                  allTags.map((t, i) => (
                    <span key={`${t}_${i}`} className={tagPill} title={`#${t}`}>
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className={noTagsPill}>No tags</span>
                )}
              </div>

              {/* Fade edge hints there is more content to scroll horizontally */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-zinc-950/30 to-transparent" />
            </div>
          </div>

          {/* Reactions row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Open post</span>
            <span className="text-xs font-medium text-zinc-300">Read</span>
          </div>
        </div>
      </div>
    </article>
  );
}

TopPostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    content: PropTypes.string,
    category: PropTypes.string,
    tags: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          text: PropTypes.string,
          name: PropTypes.string,
        }),
      ]),
    ),
    reactionsCount: PropTypes.number,
  }).isRequired,
};

export default TopPostCard;
