from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.responses import JSONResponse
import base64
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

# Load default API key from environment
default_api_key = os.getenv("GOOGLE_API_KEY")
if not default_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

# Configure safety settings to be less restrictive
safety_settings = [
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=types.HarmBlockThreshold.BLOCK_NONE,
    ),
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=types.HarmBlockThreshold.BLOCK_NONE,
    ),
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=types.HarmBlockThreshold.BLOCK_NONE,
    ),
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=types.HarmBlockThreshold.BLOCK_NONE,
    ),
]

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Gemini Image Editor API"}

def get_client(api_key: Optional[str] = None):
    """Return a Gemini client with the provided API key or the default one"""
    if api_key:
        try:
            # Try to initialize with user's API key and validate by making a simple API call
            client = genai.Client(api_key=api_key)
            # Simple validation - list models to check if key works
            client.models.list()
            return client
        except Exception as e:
            print(f"Invalid user API key. Error: {str(e)}")
            # Fall back to default key if user's key is invalid
            return genai.Client(api_key=default_api_key)
    # No user key provided, use default
    return genai.Client(api_key=default_api_key)

@app.post("/api/edit-image")
async def edit_image(
    file: UploadFile = File(...), 
    prompt: str = Form(...),
    x_api_key: Optional[str] = Header(None)
):
    try:
        # Read uploaded image
        image_data = await file.read()
        mime_type = file.content_type
        
        if not mime_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file is not an image")
        
        # Track which key is being used
        using_default_key = False
        
        try:
            # Try to use user's API key
            if x_api_key:
                client = genai.Client(api_key=x_api_key)
                # Validate the key with a simple operation
                client.models.list()
            else:
                using_default_key = True
                client = genai.Client(api_key=default_api_key)
        except Exception as e:
            # If user key fails, fall back to default
            using_default_key = True
            client = genai.Client(api_key=default_api_key)
        
        # Process with Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=[
                prompt, 
                types.Part.from_bytes(data=image_data, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_modalities=['Text', 'Image'],
                safety_settings=safety_settings
            )
        )
        
        # Extract image from response
        response_data = {
            "message": "Processing complete",
            "using_default_key": using_default_key
        }
        
        for part in response.candidates[0].content.parts:
            if part.text is not None:
                response_data["text"] = part.text
            elif part.inline_data is not None:
                # Return base64 encoded image data
                response_data["image"] = base64.b64encode(part.inline_data.data).decode("utf-8")
                response_data["mime_type"] = part.inline_data.mime_type
        
        if "image" not in response_data:
            return JSONResponse(
                status_code=404, 
                content={"error": "No image generated", "text": response_data.get("text", "")}
            )
        
        return response_data
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/api/edit-image-dual")
async def edit_image_dual(
    primary_image: UploadFile = File(...),
    secondary_image: UploadFile = File(...),
    prompt: str = Form(...),
    x_api_key: Optional[str] = Header(None)
):
    try:
        # Read uploaded images
        primary_data = await primary_image.read()
        primary_mime_type = primary_image.content_type
        
        secondary_data = await secondary_image.read()
        secondary_mime_type = secondary_image.content_type
        
        if not primary_mime_type.startswith("image/") or not secondary_mime_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Both uploaded files must be images")
        
        # Track which key is being used
        using_default_key = False
        
        try:
            # Try to use user's API key
            if x_api_key:
                client = genai.Client(api_key=x_api_key)
                # Validate the key with a simple operation
                client.models.list()
            else:
                using_default_key = True
                client = genai.Client(api_key=default_api_key)
        except Exception as e:
            # If user key fails, fall back to default
            using_default_key = True
            client = genai.Client(api_key=default_api_key)
        
        # Process with Gemini - send both images in the content
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=[
                prompt, 
                types.Part.from_bytes(data=primary_data, mime_type=primary_mime_type),
                types.Part.from_bytes(data=secondary_data, mime_type=secondary_mime_type)
            ],
            config=types.GenerateContentConfig(
                response_modalities=['Text', 'Image'],
                safety_settings=safety_settings
            )
        )
        
        # Extract image from response
        response_data = {
            "message": "Processing complete",
            "using_default_key": using_default_key
        }
        
        for part in response.candidates[0].content.parts:
            if part.text is not None:
                response_data["text"] = part.text
            elif part.inline_data is not None:
                # Return base64 encoded image data
                response_data["image"] = base64.b64encode(part.inline_data.data).decode("utf-8")
                response_data["mime_type"] = part.inline_data.mime_type
        
        if "image" not in response_data:
            return JSONResponse(
                status_code=404, 
                content={"error": "No image generated", "text": response_data.get("text", "")}
            )
        
        return response_data
        
    except Exception as e:
        print(f"Error processing images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")

@app.post("/api/generate-image/")
async def generate_image(
    prompt: str = Form(...),
    x_api_key: Optional[str] = Header(None)
):
    try:
        # Track which key is being used
        using_default_key = False
        
        try:
            # Try to use user's API key
            if x_api_key:
                client = genai.Client(api_key=x_api_key)
                # Validate the key with a simple operation
                client.models.list()
            else:
                using_default_key = True
                client = genai.Client(api_key=default_api_key)
        except Exception as e:
            # If user key fails, fall back to default
            using_default_key = True
            client = genai.Client(api_key=default_api_key)
        
        # Process with Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['Text', 'Image'],
                safety_settings=safety_settings
            )
        )
        
        # Extract image from response
        response_data = {
            "message": "Processing complete",
            "using_default_key": using_default_key
        }
        
        for part in response.candidates[0].content.parts:
            if part.text is not None:
                response_data["text"] = part.text
            elif part.inline_data is not None:
                # Return base64 encoded image data
                response_data["image"] = base64.b64encode(part.inline_data.data).decode("utf-8")
                response_data["mime_type"] = part.inline_data.mime_type
        
        if "image" not in response_data:
            return JSONResponse(
                status_code=404, 
                content={"error": "No image generated", "text": response_data.get("text", "")}
            )
        
        return response_data
        
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")

@app.post("/api/validate-key/")
async def validate_key(x_api_key: str = Header(...)):
    try:
        # Try to initialize with user's API key and validate
        client = genai.Client(api_key=x_api_key)
        # Simple validation - list models to check if key works
        client.models.list()
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Invalid API key: {str(e)}"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)