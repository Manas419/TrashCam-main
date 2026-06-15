const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    const email = 'admin1@trashcam.com';
    const password = 'admin123';

    console.log('Creating admin user...');
    
    // Check if user already exists
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

      // Add user data to Firestore
      console.log('Adding user data to Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      
      console.log('Admin user created and configured successfully!');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists. You can use the existing account.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();