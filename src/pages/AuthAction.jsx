import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";

import { auth } from "../firebase";
import Spinner from "../components/Spinner";

const ACTION_COPY = {
  verifyEmail: {
    eyebrow: "Email verification",
    loadingTitle: "Verifying your email",
    successTitle: "Email verified",
    successBody:
      "Your LifeRecompiled account is ready. You can now log in and continue.",
    errorTitle: "Verification link did not work",
    errorBody:
      "This verification link may be expired, already used, or incomplete. Please log in and request a new verification email.",
  },
  resetPassword: {
    eyebrow: "Password reset",
    loadingTitle: "Checking reset link",
    successTitle: "Password updated",
    successBody:
      "Your password has been reset. You can now log in with your new password.",
    errorTitle: "Reset link did not work",
    errorBody:
      "This reset link may be expired, already used, or incomplete. Please request a new password reset email.",
  },
};

const authErrorMessages = {
  "auth/expired-action-code":
    "This link has expired. Please request a fresh email and try again.",
  "auth/invalid-action-code":
    "This link is invalid or has already been used. Please request a fresh email.",
  "auth/user-disabled":
    "This account has been disabled. Please contact support if you think this is a mistake.",
  "auth/user-not-found":
    "We could not find an account for this action link. Please request a fresh email.",
  "auth/weak-password":
    "Please choose a stronger password before continuing.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
};

const getFriendlyError = (error, fallback) =>
  authErrorMessages[error?.code] || fallback;

const validatePassword = (password, confirmPassword) => {
  if (!password) return "Password is required.";
  if (password.length < 6)
    return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  if (password !== confirmPassword) return "Passwords do not match.";

  return "";
};

const AuthShell = ({ eyebrow, title, body, children }) => (
  <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-10">
    <section className="ui-card w-full p-6 sm:p-8" aria-live="polite">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-sky-300">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold text-zinc-100">
        {title}
      </h1>
      {body ? (
        <p className="mt-3 text-center text-sm leading-6 text-zinc-300">
          {body}
        </p>
      ) : null}

      <div className="mt-6">{children}</div>
    </section>
  </div>
);

AuthShell.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const AuthAction = () => {
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";
  const continueUrl = searchParams.get("continueUrl") || "";
  const lang = searchParams.get("lang") || "";

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actionPromiseRef = useRef({ key: "", promise: null });

  const actionCopy = ACTION_COPY[mode] || {
    eyebrow: "Account action",
    loadingTitle: "Checking link",
    errorTitle: "This link is not supported",
    errorBody:
      "The email link is missing required information or uses an unsupported action.",
  };

  const loginState = useMemo(
    () => ({
      email: resetEmail || "",
      continueUrl,
      lang,
    }),
    [continueUrl, lang, resetEmail],
  );

  useEffect(() => {
    let cancelled = false;
    const actionKey = `${mode}:${oobCode}`;

    const createActionPromise = async () => {
      if (!mode || !oobCode) {
        return {
          status: "error",
          message: actionCopy.errorBody,
        };
      }

      if (mode === "verifyEmail") {
        try {
          await applyActionCode(auth, oobCode);
          return { status: "success" };
        } catch (error) {
          return {
            status: "error",
            message: getFriendlyError(error, ACTION_COPY.verifyEmail.errorBody),
          };
        }
      }

      if (mode === "resetPassword") {
        try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          return { status: "reset-ready", email };
        } catch (error) {
          return {
            status: "error",
            message: getFriendlyError(
              error,
              ACTION_COPY.resetPassword.errorBody,
            ),
          };
        }
      }

      return {
        status: "error",
        message: actionCopy.errorBody,
      };
    };

    const runAction = async () => {
      setStatus("loading");
      setMessage("");

      const cachedPromise =
        actionPromiseRef.current.key === actionKey
          ? actionPromiseRef.current.promise
          : null;

      const actionPromise = cachedPromise || createActionPromise();
      actionPromiseRef.current = {
        key: actionKey,
        promise: actionPromise,
      };

      const result = await actionPromise;

      if (cancelled) return;

      if (result.status === "success") {
        setStatus("success");
      } else if (result.status === "reset-ready") {
        setResetEmail(result.email || "");
        setStatus("reset-ready");
      } else {
        setStatus("error");
        setMessage(result.message || actionCopy.errorBody);
      }
    };

    runAction();

    return () => {
      cancelled = true;
    };
  }, [actionCopy.errorBody, actionCopy.loadingTitle, mode, oobCode]);

  const handleResetSubmit = async (event) => {
    event.preventDefault();

    const nextError = validatePassword(password, confirmPassword);
    if (nextError) {
      setFormError(nextError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setFormError(
        getFriendlyError(
          error,
          "We could not update your password. Please request a new reset link.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthShell
        eyebrow={actionCopy.eyebrow}
        title={actionCopy.loadingTitle}
        body="Please wait while we validate your secure email link."
      >
        <Spinner message="Checking link..." />
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell
        eyebrow={actionCopy.eyebrow}
        title={actionCopy.successTitle}
        body={actionCopy.successBody}
      >
        <Link
          to="/login"
          state={loginState}
          className="ui-button-primary w-full justify-center py-2.5"
        >
          Back to login
        </Link>
      </AuthShell>
    );
  }

  if (status === "reset-ready") {
    return (
      <AuthShell
        eyebrow={ACTION_COPY.resetPassword.eyebrow}
        title="Choose a new password"
        body={
          resetEmail
            ? `Set a new password for ${resetEmail}.`
            : "Set a new password for your account."
        }
      >
        <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="new-password" className="ui-label">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              className={`ui-input ${formError ? "border-rose-500/80" : ""}`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (formError) setFormError("");
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="ui-label">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              className={`ui-input ${formError ? "border-rose-500/80" : ""}`}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (formError) setFormError("");
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? "reset-action-error" : undefined}
              required
            />
          </div>

          {formError ? (
            <p id="reset-action-error" className="ui-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="ui-button-primary w-full justify-center py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={actionCopy.eyebrow}
      title={actionCopy.errorTitle}
      body={message || actionCopy.errorBody}
    >
      <div
        className={
          mode === "resetPassword" ? "grid gap-3 sm:grid-cols-2" : ""
        }
      >
        <Link
          to="/login"
          state={loginState}
          className="ui-button-primary w-full justify-center py-2.5"
        >
          Back to login
        </Link>
        {mode === "resetPassword" ? (
          <Link
            to="/forgot-password"
            state={resetEmail ? { email: resetEmail } : undefined}
            className="ui-button-secondary justify-center py-2.5"
          >
            Request new link
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
};

export default AuthAction;
