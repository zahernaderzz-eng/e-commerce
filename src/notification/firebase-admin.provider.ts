// import * as admin from 'firebase-admin';
// import { Logger } from '@nestjs/common';

// export const firebaseAdminProvider = {
//   provide: 'FIREBASE_ADMIN',
//   useFactory: () => {
//     const logger = new Logger('FirebaseProvider');

//     const projectId = process.env.PROJECT_ID;
//     const clientEmail = process.env.CLIENT_EMAIL;
//     const privateKey = process.env.PRIVATE_KEY;

//     if (!projectId || !clientEmail || !privateKey) {
//       logger.warn(
//         'Firebase credentials are not fully configured (PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).',
//       );
//       return admin;
//     }

//     try {
//       if (!admin.apps.length) {
//         admin.initializeApp({
//           credential: admin.credential.cert({
//             projectId,
//             clientEmail,
//             privateKey: privateKey.replace(/\\n/g, '\n'),
//           }),
//         });
//         logger.log('Firebase Admin initialized');
//       } else {
//         logger.log('Firebase Admin already initialized');
//       }
//     } catch (err) {
//       logger.error('Failed to initialize Firebase Admin SDK', err as any);
//     }

//     return admin;
//   },
// };
