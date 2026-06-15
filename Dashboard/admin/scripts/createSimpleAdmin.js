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

async function createSimpleAdmin() {
  const email = 'simple.admin@trashcam.com';
  const password = 'Simple123';
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully');
    
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('User role set successfully');
    } catch (dbError) {
      console.log('Database write failed, but user was created');
    }
    
    console.log('----------------------------------------');
    console.log('Use these credentials to log in:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: Admin');
    console.log('----------------------------------------');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('You can use these credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: Admin');
    } else {
      console.error('Error:', error.message);
    }
  }
}

createSimpleAdmin();