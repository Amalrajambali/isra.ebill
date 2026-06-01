# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

For public PDF links, configure Firebase Storage in your environment:
- `FIREBASE_STORAGE_BUCKET` or let it default to `<project-id>.appspot.com`

For invoice data persistence on the server, configure Firestore credentials in your environment:
- `FIREBASE_SERVICE_ACCOUNT_KEY` or the trio `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
