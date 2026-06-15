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

async function createUser(email, password, role, zone = null) {
  try {
    console.log(`Creating ${role} user...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userData = {
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    if (zone) {
      userData.zone = zone;
    }

    await setDoc(doc(db, 'users', user.uid), userData);
    console.log(`${role} user created successfully:`, user.uid);
    return user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`${role} user already exists`);
    } else {
      console.error(`Error creating ${role}:`, error.message);
    }
  }
}

async function createTestUsers() {
  // Create a zonal head for North zone
  await createUser('zonalhead.north@trashcam.com', 'zonal123', 'zonal head', 'north');
  
  // Create two drivers
  await createUser('driver1@trashcam.com', 'driver123', 'driver', 'north');
  await createUser('driver2@trashcam.com', 'driver123', 'driver', 'north');
}

createTestUsers();