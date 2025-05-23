
import admin from "firebase-admin";

// Use the private key from the environment variable or the private-key.pem file
const privateKey = process.env.FIREBASE_PRIVATE_KEY || 
  (require('fs').readFileSync('private-key.pem', 'utf8').replace(/\\n/g, '\n'));

const serviceAccount = {
  type: "service_account",
  project_id: "crm-originaldigital",
  private_key_id: "03c085ac30b8f003c2ba5296cfcd625b376efeb5",
  private_key: privateKey.replace(/\\n/g, "\n"),
  client_email: "criar-pasta-cliente@crm-originaldigital.iam.gserviceaccount.com",
  client_id: "107324488311944700532",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/criar-pasta-cliente%40crm-originaldigital.iam.gserviceaccount.com"
};

// Initialize the app only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
