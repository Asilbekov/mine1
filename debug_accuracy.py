import cv2
import numpy as np
from paddleocr import PaddleOCR
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("debug_ocr")

class DebugSolver:
    def __init__(self):
        self.reader = PaddleOCR(use_textline_orientation=True, lang='en')

    def preprocess_image(self, image_path):
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3x Upscale
        upscaled = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        
        # Add padding (white border) to help with edge characters
        upscaled = cv2.copyMakeBorder(upscaled, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
        
        # Threshold
        # Use higher fixed threshold (220) to capture more faint pixels (thicken digits)
        _, binary = cv2.threshold(upscaled, 220, 255, cv2.THRESH_BINARY_INV)
        
        # Morphology
        kernel = np.ones((3,3), np.uint8)
        clean_img = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Invert
        clean_img = cv2.bitwise_not(clean_img)
        
        # RGB Conversion
        clean_rgb = cv2.cvtColor(clean_img, cv2.COLOR_GRAY2RGB)
        
        return clean_rgb

    def solve(self, image_path):
        processed_img = self.preprocess_image(image_path)
        
        result = self.reader.ocr(processed_img)
        
        recognized_text = ""
        if result and result[0]:
            # New API format handling
            first_result = result[0]
            if isinstance(first_result, dict):
                rec_texts = first_result.get('rec_texts', [])
                rec_polys = first_result.get('rec_polys', [])
                
                text_with_positions = []
                for i, (text, poly) in enumerate(zip(rec_texts, rec_polys)):
                    x_pos = poly[0][0] if len(poly) > 0 else 0
                    text_with_positions.append((x_pos, text))
                
                text_with_positions.sort(key=lambda x: x[0])
                for _, text in text_with_positions:
                    recognized_text += str(text)
            else:
                # Old/List format
                for line in first_result:
                    text = line[1][0]
                    recognized_text += str(text)
        
        return recognized_text

solver = DebugSolver()
image_path = "captcha_debug_1764448134.png"
result = solver.solve(image_path)
print(f"\n--- RESULTS ---")
print(f"Image: {image_path}")
print(f"Detected: '{result}'")
print(f"Expected: '751401'")
print(f"Match: {result == '751401'}")
