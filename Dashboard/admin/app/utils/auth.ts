import { 
  signInWithEmailAndPassword,
  UserCredential 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

interface LoginResponse {
  success: boolean;
  redirectPath?: string;
  error?: string;
}

export const login = async (
  email: string,
  password: string,
  expectedRole: "admin" | "zonal-head" | "driver"
): Promise<LoginResponse> => {
  try {
    // Step 1: Sign in
    console.log("Attempting sign in for:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign in successful, getting user data...");

    // Step 2: Get user data
    try {
      const userDoc = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) {
        console.error("No user document found");
        return {
          success: false,
          error: "User account not configured properly."
        };
      }

      const userData = userSnap.data();
      const userRole = userData.role;
      const normalizedUserRole = userRole.toLowerCase().replace('-', ' ');
      const normalizedExpectedRole = expectedRole.toLowerCase().replace('-', ' ');

      if (normalizedUserRole !== normalizedExpectedRole) {
        return {
          success: false,
          error: `Access denied. You are not authorized as a ${expectedRole}.`
        };
      }

      // Generate redirect path
      let redirectPath;
      switch (normalizedUserRole) {
        case "admin":
          redirectPath = "/admin/dashboard";
          break;
        case "zonal head":
          redirectPath = "/zonal-head/dashboard";
          break;
        case "driver":
          redirectPath = "/driver/dashboard";
          break;
        default:
          redirectPath = "/";
      }

      console.log("Authentication successful, redirecting to:", redirectPath);
      return {
        success: true,
        redirectPath
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {
        success: false,
        error: "Failed to load user data. Please try again."
      };
    }
  } catch (error: any) {
    console.error("Unexpected error during login:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again."
    };
  }
};