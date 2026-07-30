import shutil
import os

src = r"C:\Users\rutvi\.gemini\antigravity\brain\86b15c4b-f6ec-4348-b853-eaa3cd88939f\modern_clinic_hero_1785445559099.jpg"
dst_dir = r"e:\1Rutvi\SwasthyaSetu\swasthya-setu-ai\frontend\public\images"
dst = os.path.join(dst_dir, "clinic_hero.jpg")

os.makedirs(dst_dir, exist_ok=True)
shutil.copy(src, dst)
print("Copied clinic hero image successfully to:", dst)
