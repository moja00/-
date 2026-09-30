import os
import shutil
import zipfile
import re

ROOT_DIR = "/Users/moja/GEMINI/納品請求"
DIST_DIR = os.path.join(ROOT_DIR, "dist-flat")
ZIP_PATH = os.path.join(ROOT_DIR, "alva-erp-wordpress.zip")

print("1. Copying style.css and print.css...")
shutil.copy2(os.path.join(ROOT_DIR, "css", "style.css"), os.path.join(DIST_DIR, "style.css"))
if os.path.exists(os.path.join(ROOT_DIR, "css", "print.css")):
    shutil.copy2(os.path.join(ROOT_DIR, "css", "print.css"), os.path.join(DIST_DIR, "print.css"))

print("2. Copying app.bundle.js...")
shutil.copy2(os.path.join(ROOT_DIR, "js", "app.bundle.js"), os.path.join(DIST_DIR, "app.bundle.js"))

print("2.5 Copying data folder to dist-flat/data...")
src_data = os.path.join(ROOT_DIR, "data")
dst_data = os.path.join(DIST_DIR, "data")
if os.path.exists(src_data):
    if not os.path.exists(dst_data):
        os.makedirs(dst_data, exist_ok=True)
    for root, dirs, files in os.walk(src_data):
        rel = os.path.relpath(root, src_data)
        target_dir = os.path.join(dst_data, rel)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            if f == ".DS_Store":
                continue
            shutil.copy2(os.path.join(root, f), os.path.join(target_dir, f))

print("3. Generating dist-flat/index.html with bundle script tag and v13 cache buster...")
with open(os.path.join(ROOT_DIR, "index.html"), "r", encoding="utf-8") as f:
    html_content = f.read()

# CSSのキャッシュバスターを更新＆直下参照に変更
import time
current_v = "v=" + str(int(time.time()))

html_content = re.sub(r'href="(css/)?style\.css(\?[^"]*)?"', f'href="style.css?{current_v}"', html_content)
html_content = re.sub(r'href="(css/)?print\.css(\?[^"]*)?"', f'href="print.css?{current_v}"', html_content)

# 複数の<script src="js/..."></script>をapp.bundle.js?v=...に置換
# 既存のHTML内でjs/ファイルを読み込んでいる箇所
pattern = r'(<script src="js/[^"]+"></script>\s*)+'
bundle_tag = f'<script src="app.bundle.js?{current_v}"></script>\n'
if re.search(pattern, html_content):
    html_content = re.sub(pattern, bundle_tag, html_content)
else:
    # 既にapp.bundle.jsの場合
    html_content = re.sub(r'<script src="app\.bundle\.js(\?[^"]*)?"></script>', f'<script src="app.bundle.js?{current_v}"></script>', html_content)

with open(os.path.join(DIST_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write(html_content)

print("4. Creating alva-erp-wordpress.zip...")
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            if file == ".DS_Store":
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, DIST_DIR)
            zipf.write(file_path, arcname)

print(f"Success! alva-erp-wordpress.zip created ({os.path.getsize(ZIP_PATH)} bytes)")
