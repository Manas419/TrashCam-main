import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export interface Report {
  id: string;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  reportingMode: string;
  status: string;
  reportedBy: string;
  lastUpdated: string;
  assignedDriver: string;
  assignedVehicle: string;
  imageURL: string;
  confidence?: number;
  detectionCount?: number;
  source?: string;
}

/**
 * Fetch user/web submitted reports from the Firestore `reports` collection.
 * Returns an empty array if the collection is empty or unreachable so the
 * dashboard can always fall back to the bundled static reports.
 */
export const fetchFirestoreReports = async (): Promise<Report[]> => {
  try {
    const reportsQuery = query(
      collection(db, "reports"),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Partial<Report>;
      return {
        id: docSnap.id,
        location: data.location ?? "Unknown location",
        coordinates: data.coordinates ?? { lat: 0, lng: 0 },
        timestamp: data.timestamp ?? new Date().toISOString(),
        reportingMode: data.reportingMode ?? "Web",
        status: data.status ?? "Pending",
        reportedBy: data.reportedBy ?? "Citizen",
        lastUpdated: data.lastUpdated ?? data.timestamp ?? new Date().toISOString(),
        assignedDriver: data.assignedDriver ?? "Unassigned",
        assignedVehicle: data.assignedVehicle ?? "Unassigned",
        imageURL: data.imageURL ?? "",
        confidence: data.confidence,
        detectionCount: data.detectionCount,
        source: data.source ?? "web-report",
      };
    });
  } catch (error) {
    console.error("Failed to load reports from Firestore:", error);
    return [];
  }
};
