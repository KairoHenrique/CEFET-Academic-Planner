from PIL import Image
import math

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        if a == 0:
            new_data.append((r, g, b, 0))
            continue
            
        # If it's the yellow triangle (high red/green, low blue)
        if r > 150 and g > 130 and b < 100:
            new_data.append((r, g, b, a))
        else:
            # For everything else (dark blue and white borders), we want to turn it white.
            # But the user wants to REMOVE the white border. 
            # If we turn the dark blue to white, and the white border to transparent...
            # How to differentiate the white border from dark blue?
            # White border has high RGB. Dark blue has low RGB.
            brightness = (r + g + b) / 3
            
            if brightness > 150: # White/gray border
                # Make it transparent
                new_data.append((255, 255, 255, 0))
            else:
                # Dark blue -> make it white, keep original alpha for anti-aliasing
                new_data.append((255, 255, 255, a))

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved processed image to {output_path}")

process_image(r"app\public\logo.png", r"app\public\logo_fixed.png")
