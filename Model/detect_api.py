"""TrashCam detection API.

A small Flask service that wraps the trained YOLO model so the web dashboard
(and any other client) can run garbage detection on a single uploaded image.

Run locally:
    pip install -r requirements_api.txt
    python detect_api.py

Then POST an image to http://localhost:5000/detect (multipart field name "image").
"""

import base64
import math
import os

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO

MODEL_PATH = os.environ.get(
    "TRASHCAM_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "Workspace", "Trained Models", "bests.pt"),
)
CONF_THRESHOLD = float(os.environ.get("TRASHCAM_CONF_THRESHOLD", "0.4"))
# Longest side (px) of the annotated preview returned to the client. Keeping this
# small keeps the base64 payload well under Firestore's 1 MiB document limit.
PREVIEW_MAX_SIDE = int(os.environ.get("TRASHCAM_PREVIEW_MAX_SIDE", "720"))
CLASS_NAMES = ["garbage"]

app = Flask(__name__)
CORS(app)

model = YOLO(MODEL_PATH)
model.to("cpu")


def _encode_preview(img):
    """Resize + JPEG-encode an image to a compact base64 data URL."""
    height, width = img.shape[:2]
    if max(height, width) > PREVIEW_MAX_SIDE:
        scale = PREVIEW_MAX_SIDE / max(height, width)
        img = cv2.resize(img, (int(width * scale), int(height * scale)))
    ok, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 70])
    if not ok:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": os.path.basename(MODEL_PATH)})


@app.post("/detect")
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided (field name must be 'image')."}), 400

    file_bytes = np.frombuffer(request.files["image"].read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Could not decode the uploaded image."}), 400

    results = model(img, stream=True)
    detections = []
    max_confidence = 0.0

    for result in results:
        for box in result.boxes:
            confidence = math.floor(float(box.conf[0]) * 100) / 100
            if confidence < CONF_THRESHOLD:
                continue

            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            class_index = int(box.cls[0])
            label = CLASS_NAMES[class_index] if class_index < len(CLASS_NAMES) else str(class_index)

            detections.append(
                {"label": label, "confidence": confidence, "box": [x1, y1, x2, y2]}
            )
            max_confidence = max(max_confidence, confidence)

            cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 255), 3)
            cv2.putText(
                img,
                f"{label} {confidence:.2f}",
                (max(0, x1), max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 0, 255),
                2,
            )

    return jsonify(
        {
            "detected": len(detections) > 0,
            "count": len(detections),
            "maxConfidence": max_confidence,
            "detections": detections,
            "annotatedImage": _encode_preview(img),
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
