"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCamera,
  faLocationCrosshairs,
  faMagnifyingGlass,
  faPaperPlane,
  faSpinner,
  faTriangleExclamation,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../../../firebaseConfig";

const DETECT_API =
  process.env.NEXT_PUBLIC_DETECT_API_URL || "http://localhost:5000";

interface DetectionResult {
  detected: boolean;
  count: number;
  maxConfidence: number;
  annotatedImage: string | null;
}

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Downscale + JPEG-compress an image file into a data URL small enough to store
 * inside a Firestore document (well under the 1 MiB limit). Used as the report
 * image when the detection service did not return an annotated preview.
 */
const fileToCompressedDataUrl = (file: File, maxSide = 720): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image file"));
    };
    img.src = objectUrl;
  });

const ReportTrash = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userEmail, setUserEmail] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [location, setLocation] = useState<string>("");
  const [locating, setLocating] = useState(false);

  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detectError, setDetectError] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? "");
    });
    return () => unsubscribe();
  }, []);

  const resetDetection = () => {
    setDetection(null);
    setDetectError("");
    setSubmitted(false);
    setSubmitError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    resetDetection();
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocation(`Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) setLocation(data.display_name);
          }
        } catch {
          // Keep the lat/lng fallback if reverse geocoding fails.
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocation("");
        setLocating(false);
        setSubmitError(`Could not get location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const runDetection = async () => {
    if (!file) return;
    setDetecting(true);
    setDetectError("");
    setDetection(null);
    setSubmitted(false);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${DETECT_API}/detect`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Detection failed (${res.status})`);
      }
      const data = await res.json();
      setDetection({
        detected: data.detected,
        count: data.count,
        maxConfidence: data.maxConfidence,
        annotatedImage: data.annotatedImage ?? null,
      });
    } catch (err) {
      setDetectError(
        err instanceof Error
          ? `${err.message}. Make sure the detection service is running at ${DETECT_API}.`
          : "Detection failed."
      );
    } finally {
      setDetecting(false);
    }
  };

  const submitReport = async () => {
    if (!coords) {
      setSubmitError("Please capture your location before reporting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const now = new Date().toISOString();
      const imageURL =
        detection?.annotatedImage ||
        (file ? await fileToCompressedDataUrl(file) : "");
      await addDoc(collection(db, "reports"), {
        location: location || `Lat ${coords.lat}, Lng ${coords.lng}`,
        coordinates: { lat: coords.lat, lng: coords.lng },
        timestamp: now,
        lastUpdated: now,
        reportingMode: "Web",
        status: "Pending",
        reportedBy: userEmail || "Citizen",
        assignedDriver: "Unassigned",
        assignedVehicle: "Unassigned",
        imageURL,
        confidence: detection?.maxConfidence ?? 0,
        detectionCount: detection?.count ?? 0,
        source: "web-report",
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit the report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!file && !!coords && !submitting && !submitted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="navbar bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100 rounded-none px-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FontAwesomeIcon icon={faCamera} />
            Report Trash
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            Snap or upload a photo, detect garbage with AI, and report it to the
            authorities.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Step 1: photo */}
          <div>
            <h2 className="font-bold text-gray-800 mb-2">1. Add a photo</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-emerald-300 rounded-xl p-6 text-emerald-700 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2"
            >
              <FontAwesomeIcon icon={faCamera} className="text-3xl" />
              <span className="text-sm font-medium">
                {file ? "Choose a different photo" : "Tap to take or upload a photo"}
              </span>
            </button>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detection?.annotatedImage || previewUrl}
                alt="Trash report preview"
                className="mt-4 rounded-xl w-full object-contain max-h-80 border border-gray-200"
              />
            )}
          </div>

          {/* Step 2: location */}
          <div>
            <h2 className="font-bold text-gray-800 mb-2">2. Location</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Capture or type the location"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={captureLocation}
                disabled={locating}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <FontAwesomeIcon
                  icon={locating ? faSpinner : faLocationCrosshairs}
                  spin={locating}
                />
                {locating ? "Locating..." : "Use my location"}
              </button>
            </div>
            {coords && (
              <p className="text-xs text-gray-500 mt-1">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Step 3: detect */}
          <div>
            <h2 className="font-bold text-gray-800 mb-2">3. Detect garbage</h2>
            <button
              onClick={runDetection}
              disabled={!file || detecting}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={detecting ? faSpinner : faMagnifyingGlass}
                spin={detecting}
              />
              {detecting ? "Running model..." : "Run detection"}
            </button>

            {detectError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                <span>{detectError}</span>
              </div>
            )}

            {detection && (
              <div
                className={`mt-3 flex items-center gap-2 text-sm rounded-lg p-3 border ${
                  detection.detected
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : "text-amber-800 bg-amber-50 border-amber-200"
                }`}
              >
                <FontAwesomeIcon
                  icon={detection.detected ? faCircleCheck : faCircleXmark}
                />
                {detection.detected ? (
                  <span>
                    Garbage detected ({detection.count} region
                    {detection.count === 1 ? "" : "s"}, confidence{" "}
                    {(detection.maxConfidence * 100).toFixed(0)}%).
                  </span>
                ) : (
                  <span>
                    No garbage detected. You can still submit the report if you
                    believe this is trash.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Step 4: submit */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={submitReport}
              disabled={!canSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon
                icon={submitting ? faSpinner : faPaperPlane}
                spin={submitting}
              />
              {submitting ? "Submitting..." : "Submit report"}
            </button>

            {submitError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {submitted && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <FontAwesomeIcon icon={faCircleCheck} />
                <span>
                  Report submitted. It will now appear on the dashboard.{" "}
                  <Link href="/admin" className="underline font-medium">
                    View dashboard
                  </Link>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTrash;
