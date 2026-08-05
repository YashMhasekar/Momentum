"""
Test script to verify AI Service is working
Run this after starting chatbot_api.py
"""

import requests
import json

AI_SERVICE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        print("⚠️  Make sure chatbot_api.py is running!")
        return False

def test_detect_emotion():
    """Test emotion detection endpoint"""
    print("\nTesting emotion detection endpoint...")
    try:
        # Dummy base64 image data
        test_data = {
            "userId": "test_user",
            "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
            "sessionType": "study"
        }
        
        response = requests.post(
            f"{AI_SERVICE_URL}/detect-emotion",
            json=test_data
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Emotion detection endpoint is working!")
            print(f"Response: {response.json()}")
        else:
            print(f"⚠️  Got response but with status {response.status_code}")
            print(f"Response: {response.text}")
        
        return True
    except Exception as e:
        print(f"❌ Emotion detection test failed: {e}")
        return False

def main():
    print("="*60)
    print("AI Service Test Script")
    print("="*60)
    print()
    
    # Test health first
    if not test_health():
        print("\n❌ AI Service is not running!")
        print("\nTo start the service:")
        print("  cd backend/ai-service")
        print("  python chatbot_api.py")
        return
    
    # Test emotion detection
    test_detect_emotion()
    
    print("\n" + "="*60)
    print("Test complete!")
    print("="*60)

if __name__ == "__main__":
    main()
