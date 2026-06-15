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

const email = 'admin2@trashcam.com';
const password = 'Admin123!';

createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;
    console.log('User created:', user.uid);
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Success! Use these credentials to log in:');
      console.log('Email:', email);
      console.log('Password:', password);
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  })
  .catch((error) => {
    if (error.code === 'auth/email-already-in-use') {
      console.log('You can use these credentials to log in:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('Error:', error.code, error.message);
    }
  });