from fastapi import FastAPI, Request
import requests

app = FastAPI()

TELEGRAM_TOKEN = "8597602595:AAH8ujxBMrTtfJL4M-BuoVkxb4kkUZ5_0Uw"
TELEGRAM_URL = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

@app.get("/")
def home():
    return {"message": "My server is awake!"}

# Telegram drops off incoming messages here
@app.post("/webhook")
async def receive_message(request: Request):
    data = await request.json() # translate package data into python
    print("\n--- NEW MESSAGE RECEIVED ---")
    print(data)
    
    # Check if the package actually contains a text message
    if "message" in data and "text" in data["message"]:
        chat_id = data["message"]["chat"]["id"]  # Grab the unique ID 
        user_text = data["message"]["text"] # Grab the actual text the user typed
        
        reply_text = f"Hi bbg"
        
        # Send reply back to Telegram's servers so it shows up on the user's phone
        payload = {"chat_id": chat_id, "text": reply_text} 
        requests.post(TELEGRAM_URL, json=payload)
    
    return {"status": "ok"}