
from PIL import Image, ImageDraw

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=20)
    # Also floodfill from other corners just in case the subject touches the edge
    width, height = img.size
    ImageDraw.floodfill(img, (width - 1, 0), (0, 0, 0, 0), thresh=20)
    ImageDraw.floodfill(img, (0, height - 1), (0, 0, 0, 0), thresh=20)
    ImageDraw.floodfill(img, (width - 1, height - 1), (0, 0, 0, 0), thresh=20)
    img.save(output_path)

make_transparent('boss.png', 'boss_transparent.png')
print('Successfully created boss_transparent.png!')

