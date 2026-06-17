import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * @component EmptyState
 *
 * Small reusable empty-state block for list/system states.
 * Keeps spacing and typography consistent across dashboards without adding motion.
 *
 * @param {{ title?: string, message?: string, description?: string }} props
 * @returns {JSX.Element}
 */
const EmptyState = ({
  title,
  message = "",
  description,
  icon = "•",
  actionLabel,
  actionTo,
  onAction,
  secondaryActionLabel,
  secondaryActionTo,
  onSecondaryAction,
  surface = true,
}) => {
  const resolvedTitle = title || message || "Nothing here yet";
  const resolvedDescription = title ? description || message : description;

  const renderAction = (label, to, onClick, secondary = false) => {
    if (!label || (!to && !onClick)) return null;

    const className = secondary ? "ui-button-secondary" : "ui-button-primary";

    if (to) {
      return (
        <Link to={to} className={className}>
          {label}
        </Link>
      );
    }

    return (
      <button type="button" onClick={onClick} className={className}>
        {label}
      </button>
    );
  };

  const containerClass = surface
    ? "ui-card mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-10"
    : "mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-10";

  return (
    <div className={containerClass}>
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-lg font-semibold text-sky-300"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h2 className="text-base font-semibold text-zinc-100 sm:text-lg">
        {resolvedTitle}
      </h2>

      {resolvedDescription ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
          {resolvedDescription}
        </p>
      ) : null}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {renderAction(actionLabel, actionTo, onAction)}
          {renderAction(
            secondaryActionLabel,
            secondaryActionTo,
            onSecondaryAction,
            true,
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  actionLabel: PropTypes.string,
  actionTo: PropTypes.string,
  onAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  secondaryActionTo: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  surface: PropTypes.bool,
};

export default EmptyState;
