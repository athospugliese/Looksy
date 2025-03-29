from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.responses import JSONResponse
import base64
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import io

# Importar módulo de autenticação
from auth import auth_router, get_current_user, check_api_access, User

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

# Incluir rotas de autenticação
app.include_router(auth_router, prefix="/api")

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

@app.post("/api/edit-image/")
async def edit_image(
    file: UploadFile = File(...), 
    prompt: str = Form(...),
    x_api_key: Optional[str] = Header(None),
    current_user: User = Depends(check_api_access)  # Verificar acesso
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
            "using_default_key": using_default_key,
            "api_calls_remaining": current_user.api_calls_remaining if not current_user.is_premium else "unlimited"
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

@app.post("/api/generate-image/")
async def generate_image(
    prompt: str = Form(...),
    x_api_key: Optional[str] = Header(None),
    current_user: User = Depends(check_api_access)  # Verificar acesso
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
            "using_default_key": using_default_key,
            "api_calls_remaining": current_user.api_calls_remaining if not current_user.is_premium else "unlimited"
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
async def validate_key(
    x_api_key: str = Header(...),
    current_user: User = Depends(get_current_user)  # Apenas verificar autenticação
):
    try:
        # Try to initialize with user's API key and validate
        client = genai.Client(api_key=x_api_key)
        # Simple validation - list models to check if key works
        client.models.list()
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Invalid API key: {str(e)}"}

@app.get("/api/user/usage")
async def get_usage(current_user: User = Depends(get_current_user)):
    return {
        "api_calls_remaining": current_user.api_calls_remaining if not current_user.is_premium else "unlimited",
        "is_premium": current_user.is_premium
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)