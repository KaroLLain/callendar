import { initializeApp } from 'firebase/app'
// import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD9V7soAacm6vT5E6iLcYx-nGTl88tVVCc',
  authDomain: 'react-schedule-b15d2.firebaseapp.com',
  projectId: 'react-schedule-b15d2',
  storageBucket: 'react-schedule-b15d2.appspot.com',
  messagingSenderId: '908364229794',
  appId: '1:908364229794:web:351c2b4fa2f9ffb21bbbfb',
  measurementId: 'G-6PP8KFDPLF'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app)
const db = getFirestore(app);


export {db}
