import PropTypes from "prop-types";

/**
 * @component NoResultsMessage
 *
 * Context-aware empty state message for post listings.
 *
 * - Distinguishes between "no data in database" and "no results for filters/search"
 * - Prioritizes combined search + filter state over individual conditions
 * - Returns null when posts exist (no empty state needed)
 *
 * Behavior order (top → bottom):
 * 1. No posts in database (initial/empty app state)
 * 2. Search + filters active but no match
 * 3. Search only, no match
 * 4. Filters only, no match
 *
 * @param {Array} posts - Filtered posts array (already processed by parent)
 * @param {string} [searchTerm] - Active search query
 * @param {string[]} [selectedCategories] - Active category filters
 * @param {boolean} [canCreate] - Whether the current viewer can create posts.
 * @param {Function=} onCreatePost - Optional CTA for first-post empty state.
 * @param {Function=} onResetFilters - Optional CTA for no-results states.
 * @returns {JSX.Element|null}
 */
const NoResultsMessage = ({
  posts,
  searchTerm = "",
  selectedCategories = [],
  canCreate = false,
  onCreatePost,
  onResetFilters,
}) => {
  const searchActive = searchTerm.trim() !== "";
  const filtersActive = selectedCategories.length > 0;

  const renderState = ({ title, description, actionLabel, onAction }) => (
    <section
      className="ui-card mx-auto mt-6 flex max-w-2xl flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10"
      aria-live="polite"
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-lg font-semibold text-sky-300"
        aria-hidden="true"
      >
        •
      </div>

      <h2 className="text-base font-semibold text-zinc-100 sm:text-lg">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
        {description}
      </p>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="ui-button-secondary mt-5"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );

  // Case 1: No posts exist in the database (fresh app or all deleted)
  if (
    !posts ||
    (Array.isArray(posts) &&
      posts.length === 0 &&
      !searchActive &&
      !filtersActive)
  ) {
    return renderState({
      title: "No posts yet",
      description: canCreate
        ? "Start the first discussion by creating a post."
        : "Sign in to create the first post or check back later.",
      actionLabel: canCreate && onCreatePost ? "Create post" : null,
      onAction: canCreate ? onCreatePost : null,
    });
  }

  // Case 2: Search + filters active but no results
  if (searchActive && filtersActive && posts.length === 0) {
    return renderState({
      title: "No posts match your filters",
      description: "Try changing the search term or clearing selected filters.",
      actionLabel: onResetFilters ? "Clear filters" : null,
      onAction: onResetFilters,
    });
  }

  // Case 3: Search only, no results
  if (searchActive && posts.length === 0) {
    return renderState({
      title: "No posts match your search",
      description: "Try a different search term.",
      actionLabel: onResetFilters ? "Clear search" : null,
      onAction: onResetFilters,
    });
  }

  // Case 4: Filters only, no results
  if (filtersActive && posts.length === 0) {
    return renderState({
      title: "No posts match your filters",
      description: "Try clearing selected filters or choosing a different category.",
      actionLabel: onResetFilters ? "Clear filters" : null,
      onAction: onResetFilters,
    });
  }

  // Default: posts exist → no empty state rendered
  return null;
};

NoResultsMessage.propTypes = {
  posts: PropTypes.array.isRequired,
  searchTerm: PropTypes.string,
  selectedCategories: PropTypes.arrayOf(PropTypes.string),
  canCreate: PropTypes.bool,
  onCreatePost: PropTypes.func,
  onResetFilters: PropTypes.func,
};

export default NoResultsMessage;
