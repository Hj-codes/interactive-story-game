import requests
import random
from typing import Optional
from config import CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID


class ImageGenerationService:
    """Service for generating images using Cloudflare Workers AI."""
    
    def __init__(self):
        self.api_token = CLOUDFLARE_API_TOKEN
        self.account_id = CLOUDFLARE_ACCOUNT_ID
        self.base_url = (
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell"
            if self.account_id else None
        )
    
    def generate_image(self, prompt: str) -> Optional[str]:
        """
        Generate an image based on the prompt using Cloudflare FLUX.1 [schnell].
        Returns the base64 encoded image string or None if generation fails.
        """
        if not self.api_token or not self.account_id:
            print("Warning: Cloudflare credentials not configured. Skipping image generation.")
            return None
        
        if not self.base_url:
            return None
            
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        
        # flux-1-schnell uses JSON format
        data = {
            "prompt": prompt,
            "steps": 8,  # max allowed for schnell
        }
        
        try:
            print(f"Generating image for prompt: {prompt[:80]}...")
            response = requests.post(self.base_url, headers=headers, json=data, timeout=60)
            
            if response.status_code != 200:
                print(f"Error generating image: {response.status_code} - {response.text}")
                return None
                
            result = response.json()
            
            if result.get("success") and "result" in result:
                image_data = result["result"].get("image")
                return image_data
            elif "image" in result:
                return result["image"]
            else:
                print(f"Unexpected response format: {result.keys()}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request error during image generation: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error during image generation: {e}")
            return None


# Singleton instance
image_service = ImageGenerationService()
