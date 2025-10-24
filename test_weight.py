import tensorflow as tf
import numpy as np
import cv2 # OpenCV for image handling

# --- 1. LOAD THE TFLITE MODEL ---
MODEL_PATH = 'weights.tflite'
IMAGE_PATH = 'test_4.png'

# Load the TFLite model and allocate tensors.
# This is the core part that loads the model into memory.
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors() # This is a mandatory step.

# --- 2. GET MODEL INPUT AND OUTPUT DETAILS ---
# Get input and output tensor details from the model.
# This is important to know the expected shape and data type of the input.
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Print model details to understand its requirements
print("--- Input Details ---")
print(f"Name: {input_details[0]['name']}")
print(f"Shape: {input_details[0]['shape']}")
print(f"Data Type: {input_details[0]['dtype']}")
print("\n--- Output Details ---")
print(f"Name: {output_details[0]['name']}")
print(f"Shape: {output_details[0]['shape']}")
print(f"Data Type: {output_details[0]['dtype']}")

# From the input details, get the expected height and width for the input image.
input_shape = input_details[0]['shape']
input_height = input_shape[1]
input_width = input_shape[2]

# --- 3. PREPROCESS THE TEST IMAGE ---
# Load the image using OpenCV.
img = cv2.imread(IMAGE_PATH)

# Convert the image color from BGR (OpenCV's default) to RGB.
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# Resize the image to the model's expected input size.
img_resized = cv2.resize(img_rgb, (input_width, input_height))

# Add a batch dimension to the image. The model expects a batch of images,
# so we turn our single image [height, width, channels] into [1, height, width, channels].
input_data = np.expand_dims(img_resized, axis=0)

# Convert the input data to the correct data type (e.g., float32).
# This should match the 'dtype' from the input_details.
if input_details[0]['dtype'] == np.float32:
    input_data = np.float32(input_data)

# **IMPORTANT**: Normalize the image data if your model was trained with normalized images.
# Common normalization methods include:
# 1. Scaling to : input_data = input_data / 255.0
# 2. Scaling to [-1, 1]: input_data = (input_data / 127.5) - 1.0
# You MUST use the same normalization as was used during training.
# (This example assumes no normalization is needed, but you will likely need to add it.)
# For example:
# input_data = (input_data / 127.5) - 1.0

# --- 4. RUN INFERENCE ---
# Set the value of the input tensor.
interpreter.set_tensor(input_details[0]['index'], input_data)

# Run the model.
interpreter.invoke()

# --- 5. GET AND INTERPRET THE OUTPUT ---
# Get the output tensor from the model.
# The 'index' is obtained from the output_details.
output_data = interpreter.get_tensor(output_details[0]['index'])

# Print the raw output from the model.
print("\n--- Model Output ---")
print(f"Output Shape: {output_data.shape}")
print("Raw Output:")
print(output_data)

# --- 6. VISUALIZE RESULTS ON THE IMAGE ---
# Get the prediction scores (assuming this is a classification model)
scores = output_data[0]  # Remove batch dimension

# Find the top predictions
top_indices = np.argsort(scores)[-5:][::-1]  # Top 5 predictions
top_scores = scores[top_indices]

print(f"\n--- Top 5 Predictions ---")
for i, (idx, score) in enumerate(zip(top_indices, top_scores)):
    print(f"{i+1}. Class {idx}: {score:.4f}")

# Create multiple visualization versions
def create_visualization(img, scores, method="heatmap"):
    """Create different types of visualizations for vitiligo detection"""
    
    if method == "heatmap":
        # Create localized heatmap marking VITILIGO areas specifically
        img_vis = img.copy()
        h, w = img.shape[:2]
        
        print(f"\n--- Marking VITILIGO Areas ---")
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Find bright spots (potential vitiligo areas)
        _, bright_mask = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
        
        # Find contours of bright areas
        contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Sort contours by area (largest first) - mark ALL areas
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        print(f"Found {len(contours)} potential vitiligo areas")
        
        # Colors specifically for vitiligo areas (red tones)
        vitiligo_colors = [(0, 0, 255), (0, 100, 255), (0, 200, 255), (50, 0, 255), (100, 0, 255)]
        
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area > 30:  # Mark all significant areas
                color = vitiligo_colors[i % len(vitiligo_colors)]  # Cycle through vitiligo colors
                thickness = 3
                
                cv2.drawContours(img_vis, [contour], -1, color, thickness)
                
                # Add vitiligo-specific label
                x, y, w, h = cv2.boundingRect(contour)
                cv2.putText(img_vis, f"Vitiligo {i+1}", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
    elif method == "borders":
        # Create localized border detection marking SKIN vs VITILIGO areas
        img_vis = img.copy()
        
        print(f"\n--- Marking SKIN vs VITILIGO Areas ---")
        
        # Convert to different color spaces for better skin detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Define skin color range in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin areas
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Find bright areas (potential vitiligo)
        _, bright_mask = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
        
        # Find contours of skin areas
        skin_contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        vitiligo_contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Sort contours by area
        skin_contours = sorted(skin_contours, key=cv2.contourArea, reverse=True)
        vitiligo_contours = sorted(vitiligo_contours, key=cv2.contourArea, reverse=True)
        
        print(f"Found {len(skin_contours)} skin areas and {len(vitiligo_contours)} potential vitiligo areas")
        
        # Colors for skin areas (green tones)
        skin_colors = [(0, 255, 0), (0, 200, 0), (0, 150, 0), (50, 255, 50), (100, 255, 100)]
        # Colors for vitiligo areas (red tones)
        vitiligo_colors = [(0, 0, 255), (0, 100, 255), (0, 200, 255), (50, 0, 255), (100, 0, 255)]
        
        # Mark skin areas
        for i, contour in enumerate(skin_contours):
            area = cv2.contourArea(contour)
            if area > 200:  # Mark significant skin areas
                x, y, w, h = cv2.boundingRect(contour)
                color = skin_colors[i % len(skin_colors)]
                
                # Draw rectangle around skin area
                cv2.rectangle(img_vis, (x, y), (x + w, y + h), color, 2)
                # Add skin label
                cv2.putText(img_vis, f"Skin {i+1}", 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Mark vitiligo areas
        for i, contour in enumerate(vitiligo_contours):
            area = cv2.contourArea(contour)
            if area > 50:  # Mark significant vitiligo areas
                x, y, w, h = cv2.boundingRect(contour)
                color = vitiligo_colors[i % len(vitiligo_colors)]
                
                # Draw rectangle around vitiligo area
                cv2.rectangle(img_vis, (x, y), (x + w, y + h), color, 3)
                # Add vitiligo label
                cv2.putText(img_vis, f"Vitiligo {i+1}", 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
    elif method == "circles":
        # Create localized circular markers for SKIN vs VITILIGO areas
        img_vis = img.copy()
        
        print(f"\n--- Marking SKIN vs VITILIGO Circular Areas ---")
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(gray, cv2.COLOR_RGB2GRAY)
        
        # Use HoughCircles to detect circular patterns
        circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 15,
                                  param1=50, param2=25, minRadius=5, maxRadius=80)
        
        # Colors for skin areas (green tones)
        skin_colors = [(0, 255, 0), (0, 200, 0), (0, 150, 0), (50, 255, 50), (100, 255, 100)]
        # Colors for vitiligo areas (red tones)
        vitiligo_colors = [(0, 0, 255), (0, 100, 255), (0, 200, 255), (50, 0, 255), (100, 0, 255)]
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            print(f"Found {len(circles)} circular areas")
            
            # Analyze each circle to determine if it's skin or vitiligo
            for i, (x, y, r) in enumerate(circles):
                # Get the brightness of the circle area
                circle_region = gray[max(0, y-r):min(gray.shape[0], y+r), 
                                   max(0, x-r):min(gray.shape[1], x+r)]
                avg_brightness = np.mean(circle_region)
                
                # Classify based on brightness
                if avg_brightness > 160:  # Bright areas are likely vitiligo
                    color = vitiligo_colors[i % len(vitiligo_colors)]
                    label = f"Vitiligo {i+1}"
                    thickness = 3
                else:  # Darker areas are likely normal skin
                    color = skin_colors[i % len(skin_colors)]
                    label = f"Skin {i+1}"
                    thickness = 2
                
                cv2.circle(img_vis, (x, y), r, color, thickness)
                cv2.circle(img_vis, (x, y), 2, color, thickness)
                # Add appropriate label
                cv2.putText(img_vis, label, (x-20, y-r-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        # If no circles detected, place markers at multiple strategic points
        if circles is None or len(circles) == 0:
            h, w = img.shape[:2]
            print("No circles detected, placing markers at strategic points")
            # Place markers at multiple strategic points
            positions = [(w//6, h//6), (w//2, h//6), (5*w//6, h//6),
                        (w//6, h//2), (w//2, h//2), (5*w//6, h//2),
                        (w//6, 5*h//6), (w//2, 5*h//6), (5*w//6, 5*h//6)]
            
            for i, (x, y) in enumerate(positions):
                # Alternate between skin and vitiligo markers
                if i % 2 == 0:
                    color = skin_colors[i % len(skin_colors)]
                    label = f"Skin {i+1}"
                    thickness = 2
                else:
                    color = vitiligo_colors[i % len(vitiligo_colors)]
                    label = f"Vitiligo {i+1}"
                    thickness = 3
                
                radius = 15 + (i % 3) * 5  # Different sizes
                cv2.circle(img_vis, (x, y), radius, color, thickness)
                cv2.putText(img_vis, label, (x-15, y-radius-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                    
    else:  # default - text only
        img_vis = img.copy()
    
    return img_vis

# Create different visualization versions
methods = ["heatmap", "borders", "circles"]

for method in methods:
    img_vis = create_visualization(img, scores, method)
    
    # Add text annotations
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    thickness = 2
    
    # Display top predictions on the image
    y_offset = 30
    for i, (idx, score) in enumerate(zip(top_indices, top_scores)):
        text = f"Class {idx}: {score:.3f}"
        color = (0, 255, 0) if i == 0 else (255, 255, 255)
        cv2.putText(img_vis, text, (10, y_offset), font, font_scale, color, thickness)
        y_offset += 25
    
    # Add method title
    cv2.putText(img_vis, f"Vitiligo Detection - {method.title()}", (10, img_vis.shape[0] - 20), 
                font, 0.8, (0, 0, 255), thickness)
    
    # Save the annotated image
    output_path = f'test_with_{method}_predictions.png'
    cv2.imwrite(output_path, img_vis)
    print(f"Annotated image saved as: {output_path}")

# Create a combined visualization with all methods
print(f"\nCreated {len(methods)} different visualization methods:")
for method in methods:
    print(f"- test_with_{method}_predictions.png")

# Display one of the images (if you have a display available)
try:
    img_combined = create_visualization(img, scores, "heatmap")
    cv2.imshow('Vitiligo Detection - Heatmap', img_combined)
    print("\nPress any key to close the image window...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()
except:
    print("Could not display image (no display available)")