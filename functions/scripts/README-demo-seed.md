# LifeRecompiled full demo seed

Batch: `production-demo-v1`

## Files

- `seedFullDemoData.cjs`
- `cleanupFullDemoData.cjs`

## Safety

Both scripts require:

```bash
--confirm-production
```

Both scripts also verify the service account project id:

```txt
myblogapp-4bae3
```

The service account key must already exist locally at:

```txt
functions/.secrets/liferecompiled-prod.serviceAccount.json
```

That folder must stay in `.gitignore`.

## Install location

Copy both `.cjs` files into:

```txt
functions/scripts/
```

## Syntax check

From project root:

```bash
node --check functions/scripts/seedFullDemoData.cjs
node --check functions/scripts/cleanupFullDemoData.cjs
git status --short
```

The service account JSON must not appear in `git status`.

## Run seed

From project root:

```bash
cd functions
node scripts/seedFullDemoData.cjs --confirm-production
cd ..
```

## Verify

Check:

- Home feed has demo posts
- PostDetails works
- Comments/replies show
- Demo profiles open
- Dashboard Saved has demo saved refs for owner UID
- Firestore reactionCounts update after Cloud Functions run

## Cleanup

From project root:

```bash
cd functions
node scripts/cleanupFullDemoData.cjs --confirm-production
cd ..
```

Technical docs in `processedEvents` and `reactionLedger` may remain until Firestore TTL cleanup.
