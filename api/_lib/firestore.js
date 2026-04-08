import admin from 'firebase-admin'

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase 환경변수가 비어 있습니다.')
  }

  return { projectId, clientEmail, privateKey }
}

export function getFirestore() {
  if (!admin.apps.length) {
    const { projectId, clientEmail, privateKey } = getFirebaseConfig()
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }
  return admin.firestore()
}
