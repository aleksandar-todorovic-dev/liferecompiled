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
    `[seed] Refusing to run. Expected project ${EXPECTED_PROJECT_ID}, got ${serviceAccount.project_id}`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

const now = new Date();

function minutesAgo(minutes) {
  return Timestamp.fromDate(new Date(now.getTime() - minutes * 60 * 1000));
}

function baseSeedFields() {
  return {
    isDemo: true,
    seedBatchId: SEED_BATCH_ID,
    createdBySeed: true,
  };
}

async function assertNoExistingTestSeed() {
  const existingPost = await db.collection("posts").doc("demo_post_seed_test_001").get();

  if (existingPost.exists) {
    throw new Error(
      "Test seed already exists. Run cleanup first or inspect posts/demo_post_seed_test_001."
    );
  }
}

async function seedDemoData() {
  console.log(`[seed] Starting ${SEED_BATCH_ID}`);
  console.log(`[seed] Project: ${serviceAccount.project_id}`);

  await assertNoExistingTestSeed();

  const authorId = "demo_mina_frontend";
  const reactorId = "demo_luka_backend";
  const postId = "demo_post_seed_test_001";
  const rootCommentId = "demo_comment_seed_test_root_001";
  const replyCommentId = "demo_comment_seed_test_reply_001";

  const authorDoc = {
    badges: {
      topContributor: false,
    },
    bio:
      "Demo profile for LifeRecompiled preview content. Focused on frontend polish, readable UI, and thoughtful product details.",
    createdAt: minutesAgo(180),
    email: "demo+mina@liferecompiled.com",
    name: "Mina Frontend",
    profilePicture: "",
    role: "user",
    status: "Active",
    ...baseSeedFields(),
  };

  const reactorDoc = {
    badges: {
      topContributor: false,
    },
    bio:
      "Demo profile for testing comments, reactions, and community interactions inside LifeRecompiled.",
    createdAt: minutesAgo(175),
    email: "demo+luka@liferecompiled.com",
    name: "Luka Backend",
    profilePicture: "",
    role: "user",
    status: "Active",
    ...baseSeedFields(),
  };

  const postCreatedAt = minutesAgo(150);

  const postDoc = {
    badges: {
      mostInspiring: false,
      trending: false,
    },
    category: "Frontend",
    content:
      "Small UI decisions often decide whether a product feels finished or unfinished. A card layout, a loading state, a clear empty message, or a stable mobile view can completely change how users experience the same feature. This demo post exists to test how LifeRecompiled feels with real-looking content, comments, saved posts, and reactions.",
    createdAt: postCreatedAt,
    deleted: false,
    deletedAt: null,
    description:
      "A short demo post about how small UI details make an app feel more polished and intentional.",
    lastHotAt: null,
    locked: false,
    reactionCounts: {
      hot: 0,
      idea: 0,
      powerup: 0,
    },
    tags: [
      { id: "User Experience", text: "User Experience" },
      { id: "Frontend", text: "Frontend" },
      { id: "Product Polish", text: "Product Polish" },
    ],
    title: "Small UI Details Matter",
    title_lc: "small ui details matter",
    updatedAt: null,
    userId: authorId,
    ...baseSeedFields(),
  };

  const rootCommentDoc = {
    content:
      "This is exactly the kind of detail that makes a project feel more mature. The feature may be simple, but the presentation changes everything.",
    deleted: false,
    deletedAt: null,
    likes: [],
    parentID: null,
    postID: postId,
    timestamp: minutesAgo(120),
    userID: reactorId,
    ...baseSeedFields(),
  };

  const replyCommentDoc = {
    content:
      "Agree. I am using this thread to verify replies, author links, and comment layout in the demo environment.",
    deleted: false,
    deletedAt: null,
    likes: [],
    parentID: rootCommentId,
    postID: postId,
    timestamp: minutesAgo(110),
    userID: authorId,
    ...baseSeedFields(),
  };

  const savedPostDoc = {
    postTitleAtSave: postDoc.title,
    postUpdatedAtAtSave: postDoc.updatedAt || postDoc.createdAt,
    savedAt: minutesAgo(90),
    ...baseSeedFields(),
  };

  const reactionDocs = [
    {
      reactionType: "idea",
      userId: reactorId,
      postId,
      createdAt: minutesAgo(80),
      ...baseSeedFields(),
    },
    {
      reactionType: "hot",
      userId: reactorId,
      postId,
      createdAt: minutesAgo(79),
      ...baseSeedFields(),
    },
    {
      reactionType: "powerup",
      userId: reactorId,
      postId,
      createdAt: minutesAgo(78),
      ...baseSeedFields(),
    },
  ];

  await db.collection("users").doc(authorId).set(authorDoc);
  await db.collection("users").doc(reactorId).set(reactorDoc);
  await db.collection("posts").doc(postId).set(postDoc);

  await db.collection("comments").doc(rootCommentId).set(rootCommentDoc);
  await db.collection("comments").doc(replyCommentId).set(replyCommentDoc);

  await db
    .collection("users")
    .doc(OWNER_UID)
    .collection("savedPosts")
    .doc(postId)
    .set(savedPostDoc);

  for (const reaction of reactionDocs) {
    const reactionId = `${reaction.postId}__${reaction.userId}__${reaction.reactionType}`;
    await db.collection("reactions").doc(reactionId).set(reaction);
  }

  console.log("[seed] Done.");
  console.log("[seed] Created:");
  console.log(`- users/${authorId}`);
  console.log(`- users/${reactorId}`);
  console.log(`- posts/${postId}`);
  console.log(`- comments/${rootCommentId}`);
  console.log(`- comments/${replyCommentId}`);
  console.log(`- users/${OWNER_UID}/savedPosts/${postId}`);
  console.log("- reactions/* deterministic docs");
  console.log("");
  console.log("[seed] Wait a few seconds, then check Cloud Functions updated reactionCounts.");
}

seedDemoData().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
