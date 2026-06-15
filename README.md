# TrashCam: Intelligent Garbage Detection and Reporting System

## Overview

TrashCam is a cutting-edge technology powered by machine learning algorithms that detects trash piles and reports them to the appropriate authorities in real-time, streamlining the Urban Waste Management System. 


## Features

- Real-time garbage detection using existing CCTV cameras and drones
- Public involvement in reporting trash
- Integration with smart city initiatives
- Comprehensive dashboard for authorities
- User-friendly interface for public reporting



### Tech Stack

- Python
- TensorFlow
- OpenCV
- YOLOv5
- Flask
- React
- MongoDB

## Architecture

The system architecture includes:

- Data Collection
- Model Selection and Training
- Database Management
- Location Tracking and Reporting 
- Model Deployment 
- Model Monitoring, Maintenance and Optimization

## Unique Value Proposition

- Automated waste detection
- Real-time reporting
- Integration with existing infrastructure
- Community involvement
- Predictive maintenance

## Impact and Benefits

- Improved urban cleanliness
- Enhanced quality of life
- Efficient waste management
- Reduced environmental impact
- Cost savings for municipalities

## Challenges and Solutions

1. Compatibility and Scalability Issues
   - Solution: Real-time monitoring, user feedback integration, adaptive learning, and regular retraining

2. Data Integrity and Consistency
   - Solution: Automated data cleaning and concurrency control

3. Data Security and Privacy
   - Solution: End-to-end encryption, MFA, legal compliance, and data retention policies





## Contact

### Author

Manas Patil

### Contact

Email: patilmanas419@gmail.com  
Phone: 9028015213  
Address: Amrutvahini Collage od Enginnering

## Vercel Deployment

Deploy the web dashboard from `Dashboard/admin`, not from the repository root.

In Vercel project settings:

- Root Directory: `Dashboard/admin`
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave default

If the chatbot is used, add `GEMINI_API` in Vercel Environment Variables.

## Web Reporting (Detect & Report Trash)

Logged-in users can report trash directly from the web dashboard at
`/admin/report`:

1. Take or upload a photo.
2. Capture the location (GPS, with reverse geocoding to an address).
3. Run AI detection — the photo is sent to the **detection service**
   (`Model/detect_api.py`) which wraps the trained YOLO model and returns an
   annotated preview plus a confidence score.
4. Submit — the report is saved to the Firestore `reports` collection and shows
   up in the dashboard list and on the hotspot map.

The model is Python/PyTorch and cannot run inside Next.js / Vercel, so the
detection service runs as a separate process. See
[`Model/README_DETECT_API.md`](Model/README_DETECT_API.md) to run it, and set
`NEXT_PUBLIC_DETECT_API_URL` in `Dashboard/admin` (see `.env.example`) to its
URL.
