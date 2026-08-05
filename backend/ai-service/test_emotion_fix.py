"""
Test script to verify emotion detection fix
Tests that the endpoint returns JSON-serializable data
"""

import requests
import json
import base64
import cv2
import numpy as np

def create_test_image():
    """Create a simple test image"""
    # Create a blank image (black)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Add some color to make it more realistic
    img[:] = (100, 100, 100)  # Gray background
    
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', img)
    
    # Convert to base64
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return f"data:image/jpeg;base64,{img_base64}"

def test_detect_emotion():
    """Test the /detect-emotion endpoint"""
    print("\n" + "="*60)
    print("🧪 Testing Emotion Detection Endpoint")
    print("="*60)
    
    url = "http://127.0.0.1:8000/detect-emotion"
    
    # Create test payload
    payload = {
        "userId": "test_user_123",
        "imageData": create_test_image(),
        "sessionType": "study",
        "duration": 6
    }
    
    print("\n📤 Sending request to:", url)
    print("📦 Payload size:", len(json.dumps(payload)), "bytes")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        print("\n📊 Response Status:", response.status_code)
        
        if response.status_code == 200:
            print("✅ SUCCESS: Endpoint returned 200 OK")
            
            # Try to parse JSON
            try:
                data = response.json()
                print("\n📄 Response Data:")
                print(json.dumps(data, indent=2))
                
                # Verify data types
                print("\n🔍 Data Type Verification:")
                if data.get("success"):
                    print("✅ success:", type(data["success"]), "=", data["success"])
                    print("✅ emotion:", type(data["emotion"]), "=", data["emotion"])
                    print("✅ timestamp:", type(data["timestamp"]), "=", data["timestamp"])
                    
                    if "scores" in data:
                        print("✅ scores:", type(data["scores"]))
                        for emotion, score in data["scores"].items():
                            print(f"   - {emotion}: {type(score).__name__} = {score}")
                    
                    print("\n🎉 All data types are JSON-serializable!")
                else:
                    print("⚠️ Detection failed (this is OK if no face detected)")
                    print("   Error:", data.get("error"))
                
            except json.JSONDecodeError as e:
                print("❌ FAILED: Response is not valid JSON")
                print("Error:", str(e))
                print("Response text:", response.text[:500])
        else:
            print(f"❌ FAILED: Endpoint returned {response.status_code}")
            print("Response:", response.text[:500])
            
    except requests.exceptions.ConnectionError:
        print("❌ FAILED: Cannot connect to AI service")
        print("   Make sure the service is running: python chatbot_api.py")
    except requests.exceptions.Timeout:
        print("❌ FAILED: Request timed out")
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {str(e)}")

def test_health():
    """Test the health endpoint"""
    print("\n" + "="*60)
    print("🏥 Testing Health Endpoint")
    print("="*60)
    
    url = "http://127.0.0.1:8000/health"
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            print("✅ AI Service is running")
            data = response.json()
            print("📊 Status:", data)
        else:
            print(f"⚠️ Health check returned {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ AI Service is NOT running")
        print("   Start it with: cd backend/ai-service && python chatbot_api.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Emotion Detection Fix Verification")
    print("="*60)
    print("\nThis script tests if the NumPy serialization fix works correctly.")
    print("It will send a test image to the emotion detection endpoint.")
    
    # Test health first
    test_health()
    
    # Test emotion detection
    test_detect_emotion()
    
    print("\n" + "="*60)
    print("✅ Testing Complete")
    print("="*60)
    print("\nIf you see '200 OK' and valid JSON data, the fix is working!")
    print("If you see errors, make sure:")
    print("  1. AI Service is running (python chatbot_api.py)")
    print("  2. Port 8000 is not blocked")
    print("  3. All dependencies are installed (pip install -r requirements.txt)")
    print("\n")
