// js/config/firebase.js

// === Firebase মডিউল ইম্পোর্ট করবেন না ===
// আমরা ধরে নিচ্ছি 'firebase' অবজেক্টটি index.html-এর CDN <script> ট্যাগ থেকে গ্লোবালি লোড হয়েছে।

let app;
let auth;
let db;
let googleProvider;
let serverTimestamp;
let firebaseInstance; // গ্লোবাল অবজেক্ট ধরার জন্য

// চেক করুন গ্লোবাল 'firebase' অবজেক্টটি লোড হয়েছে কিনা
if (!window.firebase || !window.firebase.app) {
  console.error('❌ Firebase লাইব্রেরি CDN থেকে লোড হয়নি! index.html ফাইল চেক করুন।');

  // UI-তে একটি স্থায়ী এরর মেসেজ দেখান
  const body = document.querySelector('body');
  if (body && !document.getElementById('firebase-init-error')) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'firebase-init-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.right = '0';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.zIndex = '99999';
    errorDiv.textContent = 'Firebase লাইব্রেরি লোড হয়নি। index.html ফাইলে <script> ট্যাগগুলো ঠিক আছে কিনা দেখুন।';
    body.prepend(errorDiv);
  }
} else {
  try {
    // গ্লোবাল 'firebase' অবজেক্টটি ব্যবহার করুন
    firebaseInstance = window.firebase;

    // আপনার Firebase কনফিগারেশন কী (Keys)
    // .env ফাইল এখানে কাজ করবে না, তাই কী-গুলো সরাসরি এখানে থাকতে হবে।
    const firebaseConfig = {
      apiKey: 'AIzaSyAkw1kL7AU73Y9FWrPZ-ERv5xFvXGGILBA',
      authDomain: 'claritybudget-6lnmd.firebaseapp.com',
      projectId: 'claritybudget-6lnmd',
      storageBucket: 'claritybudget-6lnmd.firebasestorage.app',
      messagingSenderId: '40318182466',
      appId: '1:40318182466:web:c2ce0637f8f23afa95b9db',
    };

    // Firebase ইনিশিয়ালাইজ করুন
    if (!firebaseInstance.apps.length) {
      app = firebaseInstance.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully (from global CDN).');
    } else {
      app = firebaseInstance.app();
      console.log('✅ Firebase app already initialized (from global CDN).');
    }

    // সার্ভিসগুলো সেট করুন
    auth = firebaseInstance.auth();
    db = firebaseInstance.firestore();
    googleProvider = new firebaseInstance.auth.GoogleAuthProvider();
    serverTimestamp = firebaseInstance.firestore.FieldValue.serverTimestamp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    // UI-তে এরর দেখান
    const body = document.querySelector('body');
    if (body && !document.getElementById('firebase-init-error')) {
      const errorDiv = document.createElement('div');
      errorDiv.id = 'firebase-init-error';
      errorDiv.style.cssText =
        'position:fixed; top:0; left:0; right:0; background:red; color:white; padding:10px; text-align:center; z-index:99999;';
      errorDiv.textContent = `Firebase আরম্ভ করতে সমস্যা হয়েছে (${error.message})।`;
      body.prepend(errorDiv);
    }
  }
}

// এখন এই ভেরিয়েবলগুলো অন্যান্য মডিউলে এক্সপোর্ট করুন
export { app, auth, db, googleProvider, serverTimestamp, firebaseInstance as firebase };
