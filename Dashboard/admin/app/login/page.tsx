"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "zonal-head" | "driver">("admin");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("[Login] Submit clicked", { email, role });
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email, role });

      // Special cases for test admins
      if ((email === 'simple.admin@trashcam.com' || email === 'admin2@trashcam.com') && role === 'admin') {
        console.log("Using test admin account");
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // Set auth cookie for middleware
          const token = await userCredential.user.getIdToken();
          document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
          console.log("Test admin login successful");
          window.location.href = '/admin/dashboard';
          return;
        } catch (error: any) {
          console.error("Test admin login failed:", error);
          setError("Invalid email or password");
          setIsLoading(false);
          return;
        }
      }

      // Regular login flow
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth successful");
      // Set auth cookie for middleware
      try {
        const token = await userCredential.user.getIdToken();
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
      } catch (e) {
        console.warn('Failed to set auth cookie', e);
      }

      try {
        const userDoc = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userDoc);

        if (!userSnap.exists()) {
          console.log("No user document found");
          // If email ends with @trashcam.com, we'll assume it's an admin
          if (email.endsWith('@trashcam.com')) {
            console.log("Trashcam email detected, assuming admin role");
            window.location.href = '/admin';
            return;
          }
          setError("User account not properly configured");
          setIsLoading(false);
          return;
        }

        const userData = userSnap.data();
        console.log("User data:", userData);

        // Step 3: Verify role
        if (!userData.role) {
          setError("User role not found");
          setIsLoading(false);
          return;
        }

        const userRole = userData.role.toLowerCase();
        const expectedRole = role.toLowerCase();

        console.log("Checking roles:", { userRole, expectedRole });

        if (userRole !== expectedRole) {
          setError(`Access denied. You are not authorized as ${role}`);
          setIsLoading(false);
          return;
        }

        // Step 4: Redirect
        // Format the role to match the folder structure
        let routePath = userRole;
        if (userRole === "zonal head") {
          routePath = "zonal-head";
        }

        const redirectPath = `/${routePath}`;
        console.log("Login successful, redirecting to:", redirectPath);
        window.location.href = redirectPath;

      } catch (dbError) {
        console.error("Database error:", dbError);
        setError("Failed to verify user role");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "An unexpected error occurred";

      if (error.code === "auth/invalid-credential") {
        message = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection";
      }

      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-[#a5d6a7]">
        <h1 className="text-3xl font-bold text-center text-[#1b5e20] mb-8">
          Login
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-900 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-[#a5d6a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#81c784] text-gray-900 placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[#a5d6a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#81c784] text-gray-900 placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2">
              Please Select User Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "zonal-head" | "driver")
              }
              className="w-full px-4 py-2 border border-[#a5d6a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#81c784] bg-white text-gray-600"
              required
            >
              <option value="admin">Admin</option>
              <option value="zonal-head">Zonal Head</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-[#1b5e20] hover:text-[#0d3010] text-sm font-medium"
          >
            Forgot Your Password?
          </button>

          <button
            type="submit"
            onClick={(e) => handleSubmit(e as any)}
            disabled={isLoading}
            className={`w-full py-3 bg-gradient-to-r from-[#2e7d32] to-[#388e3c] text-white rounded-md font-semibold transition-all duration-300 shadow-lg ${isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:from-[#1b5e20] hover:to-[#2e7d32]'
              }`}
          >
            {isLoading ? 'Logging in...' : 'Submit'}
          </button>

          {error && (
            <div className="mt-4 text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold text-[#1b5e20] mb-4">
              Reset Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 text-sm font-semibold mb-2">
                  Email
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#a5d6a7] rounded-md text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                  <button
                    className="px-4 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#0d3010]"
                    onClick={() => { }}
                  >
                    Get OTP
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-semibold mb-2">
                  OTP
                </label>
                <input
                  type="text"
                  value=""
                  onChange={(e) => { }}
                  className="w-full px-4 py-2 border border-[#a5d6a7] rounded-md text-gray-900 placeholder-gray-400"
                  placeholder="Enter OTP"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2 border border-[#1b5e20] text-[#1b5e20] rounded-md hover:bg-[#f5f5f0]"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#0d3010]">
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
