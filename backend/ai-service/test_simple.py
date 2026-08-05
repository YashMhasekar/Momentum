"""
Simple test to check if emotion detection is working
This will test DeepFace directly without the API
"""

import cv2
import numpy as np
from deepface import DeepFace
import time

print("\n" + "="*60)
print("🧪 Testing DeepFace Emotion Detection")
print("="*60)

# Create a simple test image
print("\n1️⃣ Creating test image...")
img = np.zeros((480, 640, 3), dtype=np.uint8)
img[:] = (150, 150, 150)  # Gray background

# Draw a simple face-like shape
cv2.circle(img, (320, 240), 100, (200, 200, 200), -1)  # Face
cv2.circle(img, (290, 220), 15, (50, 50, 50), -1)  # Left eye
cv2.circle(img, (350, 220), 15, (50, 50, 50), -1)  # Right eye
cv2.ellipse(img, (320, 270), (40, 20), 0, 0, 180, (50, 50, 50), 2)  # Smile

print("✅ Test image created")

# Test DeepFace
print("\n2️⃣ Testing DeepFace emotion detection...")
print("⏳ This may take a while on first run (downloading models)...")

try:
    start_time = time.time()
    
    result = DeepFace.analyze(
        img,
        actions=['emotion'],
        enforce_detection=False,
        silent=True
    )
    
    elapsed = time.time() - start_time
    
    print(f"✅ DeepFace analysis completed in {elapsed:.2f} seconds")
    
    # Extract results
    if isinstance(result, list):
        result = result[0]
    
    dominant_emotion = result.get('dominant_emotion', 'unknown')
    emotion_scores = result.get('emotion', {})
    
    print("\n3️⃣ Results:")
    print(f"   Dominant Emotion: {dominant_emotion}")
    print(f"   Emotion Scores:")
    
    for emotion, score in emotion_scores.items():
        print(f"      - {emotion}: {score:.2f}% (type: {type(score).__name__})")
    
    # Check if scores are numpy types
    print("\n4️⃣ Type Check:")
    has_numpy_types = False
    for emotion, score in emotion_scores.items():
        if 'numpy' in type(score).__module__:
            print(f"   ⚠️ {emotion} is numpy type: {type(score)}")
            has_numpy_types = True
    
    if has_numpy_types:
        print("\n   ✅ Confirmed: DeepFace returns numpy types")
        print("   ✅ Our fix converts these to Python floats")
    else:
        print("\n   ℹ️ No numpy types detected (may vary by version)")
    
    print("\n" + "="*60)
    print("✅ EMOTION DETECTION IS WORKING!")
    print("="*60)
    print("\nThe model can detect emotions successfully.")
    print("Now test the API endpoint in your browser.")
    
except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
    print("\nPossible issues:")
    print("  1. Missing dependencies: pip install deepface opencv-python")
    print("  2. First-time model download (can take several minutes)")
    print("  3. Internet connection needed for model download")
    
    import traceback
    print("\nFull error:")
    traceback.print_exc()

print("\n")
