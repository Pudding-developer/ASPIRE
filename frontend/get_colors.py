import sys
from PIL import Image
import collections

img = Image.open('/home/humunculey/ASPIRE/frontend/src/assets/AI-chat.png')
img = img.convert('RGBA')
pixels = img.getdata()

colors = collections.Counter()
for r, g, b, a in pixels:
    if a > 50:
        # look for colors with high red and green (orange/copper)
        if r > 150 and g > 60 and g < 150 and b < 100:
            colors[(r, g, b)] += 1

print("Top 10 distinct copper colors (RGB):")
for color, count in colors.most_common(10):
    hex_color = "#{:02x}{:02x}{:02x}".format(color[0], color[1], color[2])
    print(f"{hex_color} : {count} pixels")
