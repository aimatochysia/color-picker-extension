from PIL import Image

def resize_image(input_image_path):
    sizes = [(16, 16), (48, 48), (128, 128)]
    base_filename = input_image_path.split('.')[0]
    with Image.open(input_image_path) as img:
        for size in sizes:
            resized_img = img.resize(size, Image.LANCZOS)
            resized_img.save(f"{base_filename}{size[0]}.png")

resize_image('icon.png')
