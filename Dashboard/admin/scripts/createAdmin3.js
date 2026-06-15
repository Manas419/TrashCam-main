const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBiz5D6iEwQYTNVOWq-lwDtFLUARr0sXXM",
  authDomain: "trash-cam-d1ff9.firebaseapp.com",
  projectId: "trash-cam-d1ff9",
  storageBucket: "trash-cam-d1ff9.appspot.com",
  messagingSenderId: "44129987983",
  appId: "1:44129987983:web:040f7e82723c6596426ffa",
  measurementId: "G-V4Z9X2BV8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = 'admin123@trashcam.com';
const adminPassword = 'Password123!';

async function createAndVerifyAdmin() {
  try {
    // First try to sign in
    try {
      console.log('Checking if admin exists...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Admin user already exists and credentials are valid.');
      console.log('You can use these credentials to log in:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      return;
    } catch (signInError) {
      // If sign in fails, create new user
      if (signInError.code === 'auth/user-not-found') {
        console.log('Creating new admin user...');
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        
        // Set up user data in Firestore
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: adminEmail,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          console.log('Admin user created successfully!');
          console.log('You can use these credentials to log in:');
          console.log('Email:', adminEmail);
          console.log('Password:', adminPassword);
        } catch (firestoreError) {
          console.log('Note: User created but role setup failed. Please try logging in anyway.');
          console.log('Email:', adminEmail);
          console.log('Password:', adminPassword);
        }
      } else {
        throw signInError;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('You can try these credentials:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }
  }
}

createAndVerifyAdmin().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});