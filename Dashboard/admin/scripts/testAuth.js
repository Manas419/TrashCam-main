const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBiz5D6iEwQYTNVOWq-lwDtFLUARr0sXXM",
  authDomain: "trash-cam-d1ff9.firebaseapp.com",
  projectId: "trash-cam-d1ff9",
  storageBucket: "trash-cam-d1ff9.appspot.com",
  messagingSenderId: "44129987983",
  appId: "1:44129987983:web:040f7e82723c6596426ffa",
  measurementId: "G-V4Z9X2BV8N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  try {
    const email = 'admin1@trashcam.com';
    const password = 'admin123';

    console.log('Testing Firebase Authentication...');
    console.log('Attempting to sign in with test credentials...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Authentication successful!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    process.exit(0);
  } catch (error) {
    console.error('Authentication Error:', error.message);
    if (error.code === 'auth/configuration-not-found') {
      console.log('\nPossible solutions:');
      console.log('1. Make sure Authentication is enabled in Firebase Console');
      console.log('2. Enable Email/Password sign-in method in Firebase Console');
      console.log('3. Make sure your Firebase project is properly initialized');
    }
    process.exit(1);
  }
}

testAuth();