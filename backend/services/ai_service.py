import requests
import json
import re
from typing import Dict, List, Optional, Tuple
from config import PERPLEXITY_API_KEY, PERPLEXITY_BASE_URL, STORY_LENGTH_WORDS, MAX_CONTEXT_LENGTH


class AIStoryService:
    """Service for generating story content using Perplexity AI."""
    
    def __init__(self):
        self.api_key = PERPLEXITY_API_KEY
        self.base_url = PERPLEXITY_BASE_URL
        self.story_prompt_template = self._get_story_prompt_template()
    
    def _get_story_prompt_template(self) -> str:
        """Get the base prompt template for story generation."""
        return """You are an interactive fiction storyteller. Continue this story based on the player's choice.

STORY CONTEXT: {context}
PLAYER'S CHOICE: {player_choice}

Rules:
- Write approximately {word_goal} words continuing the story (±50)
- End with a situation requiring a decision
- Provide exactly 3 distinct choices
- Maintain consistency with previous events
- Keep it engaging and family-friendly
- Use vivid descriptions and compelling narrative
- Create meaningful consequences for player choices
- Include character development opportunities
- Generate a concise image prompt that visually captures the current scene's mood and setting

Character Information:
{character_info}

Format response as JSON:
{{
  "story": "story continuation here",
  "choices": [
    "First choice option",
    "Second choice option", 
    "Third choice option"
  ],
  "image_prompt": "A vivid, artistic description of the scene for image generation, focusing on atmosphere and key visual elements"
}}"""

    def _make_api_request(self, prompt: str) -> Optional[Dict]:
        """Make a request to the Perplexity API."""
        if not self.api_key or self.api_key == "your_api_key_here":
            # Return mock response for demo purposes
            return self._get_mock_response(prompt)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a creative interactive fiction storyteller. Always respond with valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # Parse JSON from the content
            return self._parse_json_response(content)
            
        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")
            return self._get_fallback_response()
        
        except Exception as e:
            print(f"Error processing API response: {e}")
            return self._get_fallback_response()
    
    def _parse_json_response(self, content: str) -> Optional[Dict]:
        """Parse JSON response from AI, handling various formats."""
        try:
            # Try to parse as direct JSON
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        try:
            # Look for JSON blocks in the content
            json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
        
        try:
            # Look for JSON blocks without language specifier
            json_match = re.search(r'```\n(.*?)\n```', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
        
        try:
            # Look for JSON within curly braces
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
        
        # If all parsing fails, create a structured response
        return self._extract_story_and_choices(content)
    
    def _extract_story_and_choices(self, content: str) -> Dict:
        """Extract story and choices from unstructured content."""
        lines = content.strip().split('\n')
        story_lines = []
        choices = []
        
        current_section = 'story'
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for choice indicators
            if re.match(r'^[1-3]\.|^[abc]\)|^-\s|^\*\s', line, re.IGNORECASE):
                current_section = 'choices'
                # Clean up choice text
                choice_text = re.sub(r'^[1-3]\.|^[abc]\)|^-\s|^\*\s', '', line).strip()
                if choice_text and len(choices) < 3:
                    choices.append(choice_text)
            elif current_section == 'story':
                story_lines.append(line)
        
        story = ' '.join(story_lines) if story_lines else content
        
        # Ensure we have exactly 3 choices
        while len(choices) < 3:
            choices.append(f"Continue exploring (Option {len(choices) + 1})")
        
        return {
            "story": story[:MAX_CONTEXT_LENGTH],
            "choices": choices[:3],
            "image_prompt": "A mystical fantasy scene with ambient lighting and ethereal atmosphere"
        }
    
    def _get_mock_response(self, prompt: str) -> Dict:
        """Generate a mock response for demo purposes when no API key is provided."""
        # Extract player choice from prompt if available
        choice_match = re.search(r'PLAYER\'S CHOICE: (.+)', prompt)
        player_choice = choice_match.group(1) if choice_match else "continue"
        
        mock_stories = {
            "left": {
                "story": "You venture into the shadowy forest, where ancient trees whisper secrets of forgotten times. The canopy above blocks most of the light, creating an eerie twilight atmosphere. As you walk deeper, you notice strange glowing fungi growing on the tree trunks, pulsing with a soft blue light. Suddenly, you hear a rustling in the bushes ahead. A small, furry creature with large luminescent eyes peers at you curiously. It seems friendly but cautious. You realize this might be your first encounter with the magical inhabitants of this mysterious realm.",
                "choices": [
                    "Approach the creature slowly with open hands",
                    "Follow the glowing fungi deeper into the forest",
                    "Call out softly to see if the creature responds"
                ],
                "image_prompt": "A dark enchanted forest with ancient trees, glowing blue bioluminescent fungi on tree trunks, a small furry creature with luminescent eyes peering from bushes, mystical twilight atmosphere, fantasy digital art"
            },
            "middle": {
                "story": "You follow the mesmerizing light, feeling an inexplicable pull toward its warm glow. As you get closer, the light reveals itself to be emanating from a magnificent crystal formation rising from the ground like a natural spire. The crystal hums with energy, and you can feel its power resonating through your entire body. Ancient runes are carved around its base, glowing in rhythm with the crystal's pulse. You notice three pedestals arranged around the crystal, each holding a different colored gem - ruby red, sapphire blue, and emerald green. The air shimmers with magical energy.",
                "choices": [
                    "Touch the crystal spire directly",
                    "Examine the ancient runes more closely", 
                    "Pick up one of the colored gems from the pedestals"
                ],
                "image_prompt": "A magnificent glowing crystal spire rising from the ground, surrounded by three pedestals with ruby, sapphire and emerald gems, ancient glowing runes carved at the base, magical shimmering atmosphere, fantasy concept art"
            },
            "mountain": {
                "story": "The rocky mountain path proves more challenging than expected, but you press on, driven by curiosity about what lies ahead. The air grows thinner as you climb, and the view below becomes breathtaking. Halfway up, you discover the entrance to a cave hidden behind a waterfall. The sound of rushing water is deafening, but you can make out strange symbols carved into the rock around the cave entrance. The symbols seem to glow faintly in the mist. Inside the cave, you glimpse what appears to be ancient architecture - this is no natural formation, but rather some kind of temple or sanctuary built into the mountain itself.",
                "choices": [
                    "Enter the cave behind the waterfall",
                    "Continue climbing to reach the mountain peak",
                    "Study the glowing symbols before proceeding"
                ],
                "image_prompt": "A dramatic mountain path with a hidden cave behind a cascading waterfall, glowing ancient symbols carved in rock, misty atmosphere with ancient temple architecture visible inside, epic fantasy landscape"
            }
        }
        
        # Determine which story to use based on context
        prompt_lower = prompt.lower()
        if "left" in prompt_lower or "forest" in prompt_lower or "shadow" in prompt_lower:
            return mock_stories["left"]
        elif "middle" in prompt_lower or "light" in prompt_lower or "glow" in prompt_lower:
            return mock_stories["middle"]
        elif "right" in prompt_lower or "mountain" in prompt_lower or "rocky" in prompt_lower:
            return mock_stories["mountain"]
        else:
            # Generic continuation
            return {
                "story": "Your choice leads you to an unexpected discovery. The path ahead splits into multiple directions, each one more intriguing than the last. Strange sounds echo from the distance, and you feel the weight of destiny upon your shoulders. The adventure continues to unfold in ways you never imagined possible. You must decide carefully how to proceed, as each choice will shape the story that lies ahead.",
                "choices": [
                    "Take the path that leads toward the strange sounds",
                    "Choose the quieter route and proceed with caution",
                    "Stop and listen carefully before making your next move"
                ],
                "image_prompt": "A mystical crossroads in a fantasy realm with diverging paths, ambient mist, and soft ethereal lighting, digital art style"
            }
    
    def _get_fallback_response(self) -> Dict:
        """Get a fallback response when AI service fails."""
        return {
            "story": "The adventure continues as you face new challenges and opportunities. The world around you holds many secrets waiting to be discovered. You must choose your next action carefully, as it will determine the direction of your journey.",
            "choices": [
                "Explore the area more thoroughly",
                "Look for clues about what happened here",
                "Continue forward with determination"
            ],
            "image_prompt": "A mysterious fantasy landscape with ancient ruins and magical aura, cinematic lighting, digital art"
        }
    
    def generate_story_continuation(self, context: str, player_choice: str, 
                                  character_info: Dict = None) -> Tuple[str, List[str], str]:
        """
        Generate story continuation based on context and player choice.
        
        Args:
            context: Current story context
            player_choice: The choice made by the player
            character_info: Information about the player character
        
        Returns:
            Tuple of (story_text, list_of_choices, image_prompt)
        """
        try:
            # Prepare character information
            char_info = character_info or {"name": "Player", "traits": [], "inventory": []}
            char_summary = f"Character: {char_info.get('name', 'Player')}"
            
            if char_info.get('traits'):
                char_summary += f", Traits: {', '.join(char_info['traits'])}"
            
            if char_info.get('inventory'):
                char_summary += f", Inventory: {', '.join(char_info['inventory'])}"
            
            # Format the prompt
            prompt = self.story_prompt_template.format(
                context=context[-MAX_CONTEXT_LENGTH:],
                player_choice=player_choice,
                character_info=char_summary,
                word_goal=STORY_LENGTH_WORDS
            )
            
            # Make API request
            response = self._make_api_request(prompt)
            
            if response and 'story' in response and 'choices' in response:
                story = response['story']
                choices = response['choices']
                image_prompt = response.get('image_prompt', 'A mystical fantasy scene with magical atmosphere')
                
                # Validate and clean up response
                if len(choices) != 3:
                    choices = choices[:3] if len(choices) > 3 else choices + ["Continue the adventure"] * (3 - len(choices))
                
                # Ensure story is reasonable length
                if len(story) > MAX_CONTEXT_LENGTH:
                    story = story[: MAX_CONTEXT_LENGTH - 3] + "..."
                
                return story, choices, image_prompt
            else:
                # Use fallback response
                fallback = self._get_fallback_response()
                return fallback['story'], fallback['choices'], fallback['image_prompt']
                
        except Exception as e:
            print(f"Error in story generation: {e}")
            fallback = self._get_fallback_response()
            return fallback['story'], fallback['choices'], fallback['image_prompt']
    
    def validate_response(self, response: Dict) -> bool:
        """Validate that the AI response has the required structure."""
        return (
            isinstance(response, dict) and
            'story' in response and
            'choices' in response and
            isinstance(response['story'], str) and
            isinstance(response['choices'], list) and
            len(response['choices']) == 3 and
            all(isinstance(choice, str) for choice in response['choices'])
        )

    def generate_choices_for_story(self, story_text: str, character_info: Dict = None) -> Tuple[List[str], str]:
        """
        Generate choices for a user-provided initial story.
        
        Args:
            story_text: The user's custom starting story
            character_info: Information about the player character
            
        Returns:
            Tuple of (list_of_choices, image_prompt)
        """
        try:
            char_info = character_info or {"name": "Player", "traits": [], "inventory": []}
            char_summary = f"Character: {char_info.get('name', 'Player')}"
            
            prompt = f"""You are an interactive fiction storyteller. A player has started a story with their own beginning.

STORY START:
{story_text[:MAX_CONTEXT_LENGTH]}

CHARACTER: {char_summary}

Your task:
- Read the story beginning provided by the player
- Generate exactly 3 meaningful choices that the player could make to continue this story
- Generate a vivid image prompt that captures the scene described in the story

Rules:
- Choices should be distinct and lead to different story paths
- Keep choices engaging and consistent with the story's tone
- The image prompt should visually represent the current scene

Format response as JSON:
{{
  "choices": [
    "First choice option",
    "Second choice option", 
    "Third choice option"
  ],
  "image_prompt": "A vivid, artistic description of the scene for image generation"
}}"""

            response = self._make_api_request(prompt)
            
            if response and 'choices' in response:
                choices = response['choices']
                image_prompt = response.get('image_prompt', 'A mystical fantasy scene with magical atmosphere')
                
                # Ensure exactly 3 choices
                if len(choices) != 3:
                    choices = choices[:3] if len(choices) > 3 else choices + ["Continue the adventure"] * (3 - len(choices))
                
                return choices, image_prompt
            else:
                return [
                    "Explore your surroundings",
                    "Look for clues about what to do next",
                    "Continue forward with determination"
                ], "A mystical fantasy scene with magical atmosphere"
                
        except Exception as e:
            print(f"Error generating choices for story: {e}")
            return [
                "Explore your surroundings",
                "Look for clues about what to do next",
                "Continue forward with determination"
            ], "A mystical fantasy scene with magical atmosphere"


# Singleton instance
ai_service = AIStoryService()

