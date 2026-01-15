# DEEPFAKE-KYC-BUSTER
Real-time AI-powered deepfake detection and liveness verification system for secure digital KYC.

# 🛡️ KYC-Shield: Real-Time Deepfake Detection System

**KYC-Shield** is a high-tech security solution designed to prevent identity fraud during digital "Know Your Customer" (KYC) processes. It uses advanced Computer Vision and Deep Learning to detect face-swaps, synthetic media, and non-human liveness in real-time.



<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/d76d8740-6d55-4d84-a004-adb842ca1f88" />


## 🚀 Key Features
* **Real-time Detection:** Analyzes live video feeds with <2s latency.
* **Liveness Verification:** Ask users to perform random actions (blink, turn head) to break deepfake models.
* **Artifact Heatmap:** Highlights manipulated areas of the face (eyes, mouth) in red.
* **Pulse Detection (rPPG):** Detects tiny skin color changes from heartbeats—something deepfakes lack.
* **Fraud Score Dashboard:** Provides a "Trust Percentage" for security officers.

## 🛠️ Tech Stack
- **Frontend:** React.js / Tailwind CSS
- **Backend:** Python (FastAPI)
- **AI/ML:** TensorFlow, OpenCV, MediaPipe
- **Models:** EfficientNet-B0 (for spatial features), LSTM (for temporal consistency)

## 📁 Project Structure
```text
├── backend/
│   ├── models/             # Pre-trained .h5 or .tflite models
│   ├── processors/         # Video frame extraction & liveness logic
│   └── main.py             # FastAPI server
├── frontend/
│   ├── src/components/     # Camera & Dashboard UI
│   └── App.js
├── datasets/               # Links to DFDC / FaceForensics++ info
└── README.md
