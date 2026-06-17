import { useEffect, useMemo, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Split an array into fixed-size chunks.
 * Used to respect Firestore `in` query limits (max 10 values).
 *
 * @param {any[]} arr
 * @param {number} size
 * @returns {any[][]}
 */
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * @hook useSavedIdsForPostIds
 *
 * Returns a Set of saved post IDs for the given `postIds` list (current page).
 *
 * Why this exists:
 * - Firestore `where(documentId(), "in", [...])` supports max 10 IDs.
 * - We chunk the request into multiple queries and merge results into a Set.
 *
 * Behavior:
 * - When `userId` is missing or `postIds` is empty → returns an empty Set.
 * - Runs on dependency changes (not a real-time listener).
 * - Exposes `setSavedIds` to support optimistic save/unsave toggles in the UI.
 * - Exposes readiness so callers can avoid rendering false unsaved states
 *   before the batch lookup resolves.
 *
 * @param {string|null} userId - Current user uid
 * @param {string[]|null} postIds - Post IDs to check (usually the visible page)
 * @returns {{ savedIds: Set<string>, setSavedIds: Function, isLoadingSaved: boolean, isSavedStatusReady: boolean, checkedSavedPostIds: Set<string> }}
 */
export function useSavedIdsForPostIds(userId, postIds) {
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [resolvedLookupKey, setResolvedLookupKey] = useState("");
  const [checkedSavedPostIds, setCheckedSavedPostIds] = useState(
    () => new Set(),
  );

  const safeIds = useMemo(() => {
    // Defensive filtering prevents invalid values from reaching Firestore queries.
    if (!Array.isArray(postIds)) return [];
    return postIds.filter(Boolean);
  }, [postIds]);

  const lookupKey = useMemo(
    () => (userId && safeIds.length > 0 ? `${userId}:${safeIds.join("|")}` : ""),
    [userId, safeIds],
  );

  const isSavedStatusReady = !lookupKey || resolvedLookupKey === lookupKey;

  useEffect(() => {
    let canceled = false;

    // Guard: no user or nothing to check -> reset to empty state.
    if (!userId || safeIds.length === 0) {
      setSavedIds(new Set());
      setCheckedSavedPostIds(new Set());
      setIsLoadingSaved(false);
      setResolvedLookupKey("");
      return;
    }

    const run = async () => {
      setIsLoadingSaved(true);

      try {
        const colRef = collection(db, "users", userId, "savedPosts");
        const chunks = chunkArray(safeIds, 10);

        // Parallelize chunk queries; merge results into a Set for O(1) lookups in UI.
        const results = await Promise.all(
          chunks.map((ids) =>
            getDocs(query(colRef, where(documentId(), "in", ids))),
          ),
        );

        if (canceled) return;

        const next = new Set();
        for (const snap of results) {
          snap.forEach((d) => next.add(d.id));
        }

        setSavedIds(next);
        setCheckedSavedPostIds(new Set(safeIds));
        setResolvedLookupKey(lookupKey);
      } catch (e) {
        // Soft failure: return empty Set, keep UI stable, and log for debugging.
        if (!canceled) {
          setSavedIds(new Set());
          setCheckedSavedPostIds(new Set(safeIds));
          setResolvedLookupKey(lookupKey);
        }
        console.error("[useSavedIdsForPostIds] Failed:", e);
      } finally {
        if (!canceled) setIsLoadingSaved(false);
      }
    };

    run();

    // Cancel flag prevents state updates after unmount / fast page switches.
    return () => {
      canceled = true;
    };
  }, [userId, safeIds, lookupKey]);

  return {
    savedIds,
    setSavedIds,
    isLoadingSaved,
    isSavedStatusReady,
    checkedSavedPostIds,
  };
}
