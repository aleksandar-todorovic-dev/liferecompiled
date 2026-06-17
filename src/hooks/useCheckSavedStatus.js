import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect, useMemo } from "react";

/**
 * @hook useCheckSavedStatus
 *
 * Checks whether a specific post is saved by the current user.
 *
 * Behavior:
 * - Reads from `users/{uid}/savedPosts/{postId}` subcollection.
 * - If the document exists → post is considered saved.
 * - Skips execution when `user` or `postId` is missing.
 *
 * Design notes:
 * - This is a one-time check per dependency change (not a real-time listener).
 * - Returns `setIsSaved` to allow optimistic UI updates after save/unsave actions.
 * - Firestore read is lightweight (single document lookup).
 * - Exposes loading/ready state so UI does not render false unsaved state
 *   before the check resolves.
 *
 * @param {Object|null} user - Authenticated user object (must contain `uid`)
 * @param {string|null} postId - ID of the post to check
 * @returns {{ isSaved: boolean, setIsSaved: Function, isSavedStatusLoading: boolean, isSavedStatusReady: boolean }}
 */
export const useCheckSavedStatus = (user, postId) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);
  const [checkedLookupKey, setCheckedLookupKey] = useState("");

  const lookupKey = useMemo(
    () => (user?.uid && postId ? `${user.uid}:${postId}` : ""),
    [user?.uid, postId],
  );

  const isSavedStatusReady = !lookupKey || checkedLookupKey === lookupKey;
  const isSavedStatusLoading = Boolean(
    lookupKey && (isCheckingSaved || !isSavedStatusReady),
  );

  useEffect(() => {
    let canceled = false;

    // Guard: do not query Firestore if prerequisites are missing.
    if (!user?.uid || !postId) {
      setIsSaved(false);
      setIsCheckingSaved(false);
      setCheckedLookupKey("");
      return;
    }

    const checkIfSaved = async () => {
      setIsCheckingSaved(true);

      try {
        const ref = doc(db, "users", user.uid, "savedPosts", postId);
        const snap = await getDoc(ref);

        if (canceled) return;

        // Existence of the document defines saved state.
        setIsSaved(snap.exists());
        setCheckedLookupKey(lookupKey);
      } catch (error) {
        if (!canceled) {
          setIsSaved(false);
          setCheckedLookupKey(lookupKey);
        }
        console.error("[useCheckSavedStatus] Failed:", error);
      } finally {
        if (!canceled) setIsCheckingSaved(false);
      }
    };

    checkIfSaved();

    return () => {
      canceled = true;
    };
  }, [user?.uid, postId, lookupKey]);

  return { isSaved, setIsSaved, isSavedStatusLoading, isSavedStatusReady };
};
