# TrashCam Detection API

A small Flask service that wraps the trained YOLO model (`Workspace/Trained
Models/bests.pt`) so the web dashboard can run garbage detection on a single
uploaded photo. It powers the **"Report Trash"** page in `Dashboard/admin`.

## Run locally

```bash
cd Model
pip install -r requirements_api.txt
python detect_api.py
```

The service listens on `http://localhost:5000`.

### Environment variables

| Variable                   | Default                              | Purpose                                   |
| -------------------------- | ------------------------------------ | ----------------------------------------- |
| `TRASHCAM_MODEL_PATH`      | `Workspace/Trained Models/bests.pt`  | Path to the YOLO weights to load.         |
| `TRASHCAM_CONF_THRESHOLD`  | `0.4`                                | Minimum confidence to count a detection.  |
| `TRASHCAM_PREVIEW_MAX_SIDE`| `720`                                | Longest side (px) of the annotated reply. |
| `PORT`                     | `5000`                               | Port to listen on.                        |

## Endpoints

### `GET /health`
Returns `{ "status": "ok", "model": "bests.pt" }`.

### `POST /detect`
Multipart form-data with a single image field named `image`.

Response:

```json
{
  "detected": true,
  "count": 2,
  "maxConfidence": 0.87,
  "detections": [
    { "label": "garbage", "confidence": 0.87, "box": [12, 30, 220, 410] }
  ],
  "annotatedImage": "data:image/jpeg;base64,...."
}
```

`annotatedImage` is a compact JPEG data URL with bounding boxes drawn, small
enough to store directly in a Firestore document.

## Wiring to the web app

Set `NEXT_PUBLIC_DETECT_API_URL` in `Dashboard/admin` (see `.env.example`) to the
URL where this service is reachable. On Vercel the model cannot run inside a
serverless function, so deploy this service separately (e.g. a small VM,
Render, Railway, or a GPU/CPU box) and point the env var at it.

## Quick test

```bash
curl -F "image=@/path/to/photo.jpg" http://localhost:5000/detect
```
