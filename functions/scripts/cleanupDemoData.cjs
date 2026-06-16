const path = require("path");
const admin = require("firebase-admin");

const REQUIRE_FLAG = "--confirm-production";
const EXPECTED_PROJECT_ID = "myblogapp-4bae3";
const OWNER_UID = "47N2eyNIwPP7CsV6gcKgSwBUZ3D2";
const SEED_BATCH_ID = "production-demo-v1-test";

if (!process.argv.includes(REQUIRE_FLAG)) {
  console.error(`Refusing to run. Re-run with ${REQUIRE_FLAG}`);
  process.exit(1);
}

const serviceAccountPath = path.join(
  __dirname,
  "../.secrets/liferecompiled-prod.serviceAccount.json"
);

const serviceAccount = require(serviceAccountPath);

if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  console.error(
    `[cleanup] Refusing to run. Expected project ${EXPECTED_PROJECT_ID}, got ${serviceAccount.project_id}`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function deleteQuerySnapshot(querySnapshot, label) {
  if (querySnapshot.empty) {
    console.log(`[cleanup] No ${label} found.`);
    return;
  }

  const batch = db.batch();

  querySnapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
  console.log(`[cleanup] Deleted ${querySnapshot.size} ${label}.`);
}

async function cleanupDemoData() {
  console.log(`[cleanup] Starting cleanup for ${SEED_BATCH_ID}`);
  console.log(`[cleanup] Project: ${serviceAccount.project_id}`);

  const demoUserIds = ["demo_mina_frontend", "demo_luka_backend"];
  const demoPostIds = ["demo_post_seed_test_001"];

  const reactionsSnap = await db
    .collection("reactions")
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .get();
  await deleteQuerySnapshot(reactionsSnap, "reactions");

  const commentsSnap = await db
    .collection("comments")
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .get();
  await deleteQuerySnapshot(commentsSnap, "comments");

  for (const postId of demoPostIds) {
    await db
      .collection("users")
      .doc(OWNER_UID)
      .collection("savedPosts")
      .doc(postId)
      .delete()
      .catch(() => null);

    console.log(`[cleanup] Deleted savedPosts ref for ${postId} if it existed.`);
  }

  const postsSnap = await db
    .collection("posts")
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .get();
  await deleteQuerySnapshot(postsSnap, "posts");

  const usersSnap = await db
    .collection("users")
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .get();
  await deleteQuerySnapshot(usersSnap, "users");

  for (const uid of demoUserIds) {
    await db.collection("userStats").doc(uid).delete().catch(() => null);
    console.log(`[cleanup] Deleted userStats/${uid} if it existed.`);
  }

  console.log("[cleanup] Done.");
  console.log("[cleanup] Note: processedEvents/reactionLedger technical docs may remain until TTL cleanup.");
}

cleanupDemoData().catch((error) => {
  console.error("[cleanup] Failed:", error);
  process.exit(1);
});
