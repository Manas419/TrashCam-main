const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Your web app's Firebase configuration
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

async function createNewAdmin() {
  try {
    // New admin credentials
    const email = 'testadmin@trashcam.com';
    const password = 'Test123!@#';

    console.log('Creating new admin user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user data to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      name: 'Test Admin'
    });

    console.log('New admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('This admin account already exists.');
    } else {
      console.error('Error creating admin:', error.message);
    }
  }
}

createNewAdmin();