import { useContext, useMemo, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { FaInfoCircle } from "react-icons/fa";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";

import { AuthContext } from "../context/AuthContext";
import ReactionSummary from "./reactions/ReactionSummary";
import ReactionInfoModal from "./modals/ReactionInfoModal";
import BadgeModal from "./modals/BadgeModal";
import Badge from "./ui/Bagde";
import AuthorLink from "./AuthorLink";
import ShieldIcon from "./ui/ShieldIcon";
import Avatar from "./common/Avatar";

import { toggleSavePost } from "../utils/savedPostUtils";
import { DEFAULT_PROFILE_PICTURE } from "../constants/defaults";
import { formatPostDateLabel } from "../utils/formatDate";

import { FOCUS_RING, PILL_CATEGORY, PILL_TAG } from "../constants/uiClasses";

const CONTENT_PREVIEW_MAX = 260;
// UX cap: keep feed cards compact and avoid noisy tag floods
const MAX_TAGS_IN_APP = 5;

/**
 * Normalize tag label for display.
 *
 * - Trims whitespace
 * - Strips leading '#' characters
 * - Returns empty string for invalid input
 *
 * @param {string} t
 * @returns {string}
 */
const normalizeTagText = (t) => {
  const raw = String(t ?? "").trim();
  if (!raw) return "";
  return raw.replace(/^#+/, "").trim();
};

/**
 * @component PostCardFeed
 *
 * Feed post card used in Home/Saved lists (read-first browsing).
 *
 * - Clickable card navigates to `/post/:id`
 * - Shows compact preview (description + content excerpt)
 * - Supports save/unsave with snapshot metadata for SavedPosts consistency
 * - Shows tags rail (normalized + unique + capped; overflow via horizontal scroll)
 * - Surfaces badges (Most Inspiring / Trending) and opens BadgeModal on click
 * - Renders ReactionSummary with current user context (author vs viewer)
 *
 * Notes:
 * - Many inner controls stop propagation to avoid triggering card navigation
 * - `memo()` is used to reduce re-renders in long feed lists
 *
 * @param {Object} props
 * @param {Object} props.post - Post data used for rendering the card
 * @param {boolean} [props.isSaved] - Current saved state provided by parent list
 * @param {Function} [props.onSavedChange] - Callback(postId, nextSavedState)
 * @returns {JSX.Element}
 */
const PostCardFeed = ({ post, isSaved, onSavedChange }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [showInfo, setShowInfo] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showTopContributorModal, setShowTopContributorModal] = useState(false);

  // Unique normalized tags (max 5). Overflow handled by horizontal scroll rail.
  const allTags = useMemo(() => {
    const raw = Array.isArray(post?.tags) ? post.tags : [];

    const normalized = raw
      .map((t) => (typeof t === "string" ? t : (t?.text ?? t?.name ?? "")))
      .map((t) => normalizeTagText(t))
      .filter(Boolean);

    const seen = new Set();
    const unique = [];

    for (const t of normalized) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(t);
      if (unique.length >= MAX_TAGS_IN_APP) break;
    }

    return unique;
  }, [post?.tags]);

  // Badge list is derived from post flags and limited to two for layout stability
  const badgesToShow = useMemo(() => {
    const out = [];
    if (post?.badges?.mostInspiring)
      out.push({ key: "mostInspiring", text: "Most Inspiring" });
    if (post?.badges?.trending) out.push({ key: "trending", text: "Trending" });
    return out.slice(0, 2);
  }, [post?.badges?.mostInspiring, post?.badges?.trending]);

  // Build a stable preview that avoids layout shifts and keeps whitespace readable
  const { descText, contentPreview, isContentTruncated } = useMemo(() => {
    const normalize = (v) =>
      typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";

    const desc = normalize(post?.description);
    const content = normalize(post?.content);

    const preview = content ? content.slice(0, CONTENT_PREVIEW_MAX) : "";

    return {
      descText: desc,
      contentPreview: preview,
      isContentTruncated: content.length > CONTENT_PREVIEW_MAX,
    };
  }, [post?.description, post?.content]);

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleBadgeClick = (e, badgeKey) => {
    e.stopPropagation();
    setSelectedBadge(badgeKey);
    setShowBadgeModal(true);
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();

    // Snapshot helps SavedPosts detect stale saves after edits (title/updatedAt)
    const currentUpdated = post?.updatedAt || post?.createdAt;

    const snapshot = {
      postUpdatedAtAtSave: currentUpdated || null,
      postTitleAtSave: post?.title || "",
    };

    const nextState = await toggleSavePost(user, post.id, isSaved, snapshot);
    onSavedChange?.(post.id, nextState);
  };

  const cardBase =
    "relative flex h-full w-full flex-col overflow-hidden rounded-2xl " +
    "border border-zinc-800 bg-zinc-950 p-4 shadow-sm";

  const cardInteractive = post?.locked
    ? "cursor-pointer"
    : "cursor-pointer hover:border-zinc-700 hover:bg-zinc-950/90";

  const cardLocked = post?.locked
    ? "border-amber-500/20"
    : "";

  const cardTrending = "";

  // IMPORTANT: Ensure tag pills do NOT truncate.
  // If PILL_TAG contains truncate/max-w/overflow-hidden, these classes override it.
  const TAG_PILL_NO_TRUNC =
    `${PILL_TAG} ` +
    "shrink-0 whitespace-nowrap max-w-none overflow-visible text-clip";

  return (
    <>
      <article
        className={`${cardBase} ${cardInteractive} ${cardTrending} ${cardLocked}`}
        onClick={handleCardClick}
      >
        {/* Header: author + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="relative shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                src={post?.author?.profilePicture || DEFAULT_PROFILE_PICTURE}
                size={40}
                zoomable
                badge={post?.author?.badges?.topContributor}
              />

              {post?.author?.badges?.topContributor && (
                <button
                  type="button"
                  className="group absolute -top-2 -right-1 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTopContributorModal(true);
                  }}
                  aria-label="Top contributor info"
                  title="Top Contributor"
                >
                  <ShieldIcon className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>

            {post?.author?.id ? (
              <span className="min-w-0" onClick={(e) => e.stopPropagation()}>
                <AuthorLink author={post.author}>
                  <span className="font-semibold text-sm text-zinc-100 line-clamp-1 break-words">
                    {post.author.name}
                  </span>
                </AuthorLink>
              </span>
            ) : (
              <span className="font-semibold text-sm text-zinc-500 line-clamp-1 min-w-0">
                {post?.author?.name || "Unknown"}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}
              aria-label="Reaction info"
              className={`rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100 ${FOCUS_RING}`}
            >
              <FaInfoCircle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSaveToggle}
              aria-disabled={!user}
              className={`rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100 ${FOCUS_RING} ${
                !user ? "opacity-70" : ""
              }`}
              title={isSaved ? "Remove from saved" : "Save this post"}
            >
              {isSaved ? (
                <BsBookmarkFill className="h-4 w-4 text-sky-200" />
              ) : (
                <BsBookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>Public post</span>
          <span aria-hidden="true">•</span>
          <span>{formatPostDateLabel(post, { compact: false })}</span>
          {post?.locked && (
            <>
              <span aria-hidden="true">•</span>
              <span className="text-amber-200">Archived</span>
            </>
          )}
        </div>

        {/* Title + badges */}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="min-w-0 text-lg font-semibold leading-snug text-zinc-100 line-clamp-2 break-words sm:text-xl">
            {post?.title || ""}
          </h2>

          {badgesToShow.length > 0 ? (
            <div
              className="flex shrink-0 flex-wrap items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {badgesToShow.map((b) => (
                <Badge
                  key={b.key}
                  text={b.text}
                  onClick={(e) => handleBadgeClick(e, b.key)}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Category */}
        {post?.category ? (
          <div className="mt-3">
            <span
              className={`${PILL_CATEGORY} max-w-full overflow-hidden`}
              title={post.category}
            >
              <span className="min-w-0 truncate">{post.category}</span>
            </span>
          </div>
        ) : null}

        {/* Preview */}
        <div className="mt-3 min-h-[5.5rem]">
          {descText ? (
            <p className="text-sm leading-6 text-zinc-300 line-clamp-2 break-words">
              {descText}
            </p>
          ) : (
            <div className="min-h-[2.75rem]" aria-hidden="true" />
          )}

          {contentPreview ? (
            <p className="mt-2 text-[13px] leading-6 text-zinc-400 line-clamp-2 break-words">
              {contentPreview}
              {isContentTruncated ? "..." : ""}
            </p>
          ) : (
            <div className="mt-1 min-h-[2.75rem]" aria-hidden="true" />
          )}
        </div>

        {/* Bottom */}
        <div className="mt-auto pt-3 border-t border-zinc-800/60">
          <div className="min-h-[2.25rem]">
            {/* Tag rail: scroll on all sizes, no truncation */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div
                className={
                  "tag-rail flex items-center gap-2 flex-nowrap " +
                  "overflow-x-auto overflow-y-hidden overscroll-x-contain " +
                  "pb-3"
                }
              >
                {allTags.length > 0 ? (
                  allTags.map((t, idx) => (
                    <span
                      key={`${t}_${idx}`}
                      className={TAG_PILL_NO_TRUNC}
                      title={`#${t}`}
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-600 shrink-0 whitespace-nowrap">
                    No tags
                  </span>
                )}
              </div>

              {/* Visual fade hint (scroll affordance) */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-zinc-950/30 to-transparent" />
            </div>
          </div>

          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <ReactionSummary
              postId={post.id}
              locked={post?.locked}
              reactionCounts={
                post?.reactionCounts ?? { idea: 0, hot: 0, powerup: 0 }
              }
              userId={user?.uid ?? null}
              postAuthorId={post?.userId ?? post?.author?.id ?? null}
            />
          </div>
        </div>
      </article>

      {showInfo && (
        <ReactionInfoModal
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showBadgeModal && (
        <BadgeModal
          isOpen={showBadgeModal}
          badgeKey={selectedBadge}
          locked={post?.locked}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

      {showTopContributorModal && (
        <BadgeModal
          isOpen={showTopContributorModal}
          locked={post?.locked}
          authorBadge="topContributor"
          onClose={() => setShowTopContributorModal(false)}
        />
      )}
    </>
  );
};

PostCardFeed.propTypes = {
  post: PropTypes.object.isRequired,
  isSaved: PropTypes.bool,
  onSavedChange: PropTypes.func,
};

export default memo(PostCardFeed);
