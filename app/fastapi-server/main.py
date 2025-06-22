# app/fastapi-server/main.py

from fastapi import FastAPI
import requests
from fastapi.responses import JSONResponse, FileResponse
import os

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:3000"] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILES_DIR = os.path.join(os.path.dirname(__file__), "files")

TARGET_URL = "http://localhost:8080/upload"  # Change this to your target endpoint

BASE_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.join(BASE_DIR, "images")
POEM_DIR = os.path.join(BASE_DIR, "poem")
MUSIC_DIR = os.path.join(BASE_DIR, "music")

@app.post("/send-files")
def send_files():
    files = {
        "audio": open(os.path.join(FILES_DIR, "audio.mp3"), "rb"),
        "image1": open(os.path.join(FILES_DIR, "image1.jpg"), "rb"),
        "image2": open(os.path.join(FILES_DIR, "image2.jpg"), "rb"),
        "image3": open(os.path.join(FILES_DIR, "image3.jpg"), "rb"),
    }
    # Prepare the files for multipart upload
    multipart_files = {
        "audio": ("audio.mp3", files["audio"], "audio/mpeg"),
        "image1": ("image1.jpg", files["image1"], "image/jpeg"),
        "image2": ("image2.jpg", files["image2"], "image/jpeg"),
        "image3": ("image3.jpg", files["image3"], "image/jpeg"),
    }
    try:
        response = requests.post(TARGET_URL, files=multipart_files)
        for f in files.values():
            f.close()
        return JSONResponse(content={"status": "sent", "target_status": response.status_code, "target_response": response.text})
    except Exception as e:
        for f in files.values():
            f.close()
        return JSONResponse(content={"status": "error", "detail": str(e)}, status_code=500)

@app.get("/images/{filename}")
def get_image(filename: str):
    file_path = os.path.join(IMAGES_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")
    return JSONResponse(content={"error": "Image not found"}, status_code=404)

@app.get("/poem/{filename}")
def get_poem(filename: str):
    file_path = os.path.join(POEM_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return JSONResponse(content={"error": "Poem not found"}, status_code=404)

@app.get("/music/{filename}")
def get_music(filename: str):
    file_path = os.path.join(MUSIC_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return JSONResponse(content={"error": "Music not found"}, status_code=404)
      
      