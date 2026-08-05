import cv2
from deepface import DeepFace
import time
from collections import Counter

# ----------------------------------------
# PART 1: CAPTURE EMOTIONS
# ----------------------------------------
print("Starting emotion detection...")
print("Please look at the camera for 6 seconds...\n")

# Start webcam
cap = cv2.VideoCapture(0)

# List to store detected emotions
emotions = []

# Track start time
start_time = time.time()
duration = 6  # seconds

# ----------------------------------------
# PART 2: DETECTION LOOP
# ----------------------------------------
while True:
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    # PART 3: STOP AFTER TIME
    if elapsed_time >= duration:
        break
    
    # Read frame from webcam
    ret, frame = cap.read()
    
    if not ret:
        continue
    
    try:
        # Detect face and analyze emotion
        results = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        
        # Extract dominant emotion
        detected_emotion = results[0]['dominant_emotion']
        
        # PART 2: STORE ONLY VALID DATA
        # Only append if emotion is detected (not None or empty)
        if detected_emotion:
            emotions.append(detected_emotion)
            
        # Optional: Display live feedback
        remaining_time = int(duration - elapsed_time)
        cv2.putText(frame, f'Detecting... {remaining_time}s remaining', (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Current: {detected_emotion}', (50, 100), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        
    except Exception as e:
        # PART 2: Ignore frames where detection fails
        pass
    
    # Display frame
    cv2.imshow("Emotion Recognition", frame)
    
    # Allow early exit with 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ----------------------------------------
# PART 3: CLEANUP
# ----------------------------------------
cap.release()
cv2.destroyAllWindows()

print("\nDetection complete!\n")

# ----------------------------------------
# PART 7: ERROR HANDLING
# ----------------------------------------
if len(emotions) == 0:
    print("No face detected. Try again.")
else:
    # ----------------------------------------
    # PART 4: FINAL EMOTION CALCULATION
    # ----------------------------------------
    emotion_counts = Counter(emotions)
    final_emotion = emotion_counts.most_common(1)[0][0]
    
    # ----------------------------------------
    # PART 5: OUTPUT
    # ----------------------------------------
    print(f"Final Emotion: {final_emotion}")
    
    # ----------------------------------------
    # PART 6: EMOTION DISTRIBUTION
    # ----------------------------------------
    print("\nEmotion Distribution:")
    for emotion, count in emotion_counts.most_common():
        print(f"{emotion}: {count}")
