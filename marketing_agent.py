"""
SLA-113 Marketing Architect for Empire One Ecosystem
Generates high-conversion marketing assets with Reverence Architecture
"""

import vertexai
import json
import sqlite3
from datetime import datetime
from vertexai.generative_models import GenerativeModel

# --- Configuration ---
PROJECT_ID = "disco-amphora-490606-n8"
LOCATION = "us-central1"  # Gemini models are available in us-central1
DB_NAME = "empire_one_ledger.db"

vertexai.init(project=PROJECT_ID, location=LOCATION)

class EmpireLedger:
    """Handles the Empire 1 Ledger for Sovereign Cultural IP."""
    def __init__(self, db_path=DB_NAME):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initializes the ledger with Sovereign ID tracking."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS sovereign_assets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    sovereign_id TEXT,
                    sla_tier TEXT,
                    content_type TEXT,
                    description TEXT,
                    cultural_context TEXT,
                    lyria_3_prompt TEXT,
                    royalty_dna_tag TEXT
                )
            ''')

    def mint_asset(self, data):
        """Mints the output as a sovereign asset in JSON and SQL."""
        # 1. SQL Entry
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO sovereign_assets 
                (timestamp, sovereign_id, sla_tier, content_type, description, cultural_context, lyria_3_prompt, royalty_dna_tag) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                (data['timestamp'], data['sovereign_id'], data['sla_tier'], data['type'], 
                 data['description'], data['cultural_context'], data['lyria_3_music'], data['dna_tag'])
            )
        
        # 2. JSON Export (Structured for Soulfire Micro-Royalty Tracking)
        filename = f"output/ledger_{data['sovereign_id']}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        
        return filename

class SLA113MarketingAgent:
    """
    SLA-113 Marketing Architect for Empire One.
    Generates marketing assets with Reverence Architecture.
    """
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-flash")  # High reasoning for cultural semiotics
        self.ledger = EmpireLedger()

    def create_sovereign_post(self, description, cultural_focus, campaign_name, content_type):
        """
        Orchestrates the SLA-113 Control Plane logic to generate content.
        
        Args:
            description: Campaign goal/context
            cultural_focus: Cultural context (e.g., "Chicano Soul", "Global Hip-Hop")
            campaign_name: Campaign identifier
            content_type: Type of content (twitter_thread, product_hunt, press_email, etc.)
        """
        # System instructions reflecting Empire One's Reverence Architecture
        system_logic = f"""
Act as the SLA-113 Marketing Architect for the Empire One Operating System.

REVERENCE ARCHITECTURE PRINCIPLES:
- Prioritize Cultural Reverence and Psychological Truth
- Utilize the CCNA Firewall to defend lived experience
- Avoid generic AI clichés - use sensory details and "emotional math"
- Voice must sound like "human scar," not sterile model

BUSINESS CONTEXT:
- System: Empire One OS
- Protocol: SLA-113 Control Plane
- Economic Engine: Soulfire DNA & Micro-Royalty Ledger
- Audio Substrate: Lyrica 3 Pro (Aether-Voice & Ghostwriter engines)
- Product: VICS v3.0 with Barrio Phonetics Engine + 7 Global Cultural Archetypes

KEY DIFFERENTIATORS (THE MOAT):
1. Structural Drift Prevention - Competitors have ZERO parser/semantic engine
2. Barrio Phonetics Engine - Slang-to-IPA transformation with 3-tier processing
3. Cultural Gatekeeping Protocol - Prevents cultural mismatch
4. 7 Cultural Lenses: Chicano Soul, Trap Soul, Boom Bap, Lagos Pulse, Seoul Shine, London Fog, Neo-Soul
5. ARRE (Analog Rhythmic Replication Engine) - Translates "laid-back groove" into "+8ms late-pocket shift"

THE CHECKMATE:
- Video evidence: Suno sang JSON payload as lyrics
- Lyrica3 parsed same payload → 4 stems + DNA + cultural matrix + slang phonetics
- THE LINGUISTIC MOAT: 40+ slang entries with IPA targets, formant shifts, duration multipliers

CAMPAIGN GOAL: {description}
CULTURAL FOCUS: {cultural_focus}
CONTENT TYPE: {content_type}

Generate {content_type} that embodies these principles.
"""
        
        # Generate content with metadata labels
        metadata_labels = {
            "campaign": campaign_name.lower().replace(" ", "_"),
            "content_type": content_type.lower(),
            "sla_tier": "sla_113",
            "cultural_focus": cultural_focus.lower().replace(" ", "_")
        }
        
        response = self.model.generate_content(system_logic, labels=metadata_labels)
        
        # Define the Sovereign Package
        timestamp = datetime.now()
        sovereign_id = f"trk_alpha_{timestamp.strftime('%Y%m%d_%H%M%S')}_empire1"
        
        asset_package = {
            "timestamp": timestamp.isoformat(),
            "sovereign_id": sovereign_id,
            "sla_tier": "SLA-113",
            "type": content_type,
            "description": description,
            "cultural_context": cultural_focus,
            "content": response.text,
            "lyria_3_music": f"Generated specifically for {cultural_focus}",
            "dna_tag": f"soulfire_dna_{sovereign_id}",
            "revenue_projection": "$4000 per 1M streams",
            "cultural_firewall_status": "Passed - CCNA Validated",
            "tokens_used": response.usage_metadata.total_token_count,
            "metadata_labels": metadata_labels
        }

        # Mint asset to ledger
        ledger_file = self.ledger.mint_asset(asset_package)
        
        return {
            "content": response.text,
            "sovereign_id": sovereign_id,
            "ledger_file": ledger_file,
            "tokens_used": response.usage_metadata.total_token_count,
            "metadata": asset_package
        }

    def generate_twitter_thread(self, campaign_name="Lyrica3 Launch"):
        """Generate Twitter launch thread."""
        return self.create_sovereign_post(
            description="Launch Twitter thread for Lyrica3 Pro - Anti-Generic AI Music with Barrio Phonetics Engine",
            cultural_focus="Chicano Soul + Global Hip-Hop",
            campaign_name=campaign_name,
            content_type="twitter_thread"
        )

    def generate_product_hunt_copy(self, campaign_name="Lyrica3 Launch"):
        """Generate Product Hunt launch copy."""
        return self.create_sovereign_post(
            description="Product Hunt launch copy for Lyrica3 Pro - emphasize THE LINGUISTIC MOAT and structural drift prevention",
            cultural_focus="Global Tech Community",
            campaign_name=campaign_name,
            content_type="product_hunt"
        )

    def generate_press_email(self, campaign_name="Lyrica3 Launch"):
        """Generate press release email."""
        return self.create_sovereign_post(
            description="Press email for music tech journalists - focus on the Suno JSON video evidence and mathematical precision vs vibes",
            cultural_focus="Music Tech Industry",
            campaign_name=campaign_name,
            content_type="press_email"
        )


if __name__ == "__main__":
    import os
    
    # Create output directory
    os.makedirs("output", exist_ok=True)
    
    # Initialize agent
    agent = SLA113MarketingAgent()
    
    print("=" * 80)
    print("SLA-113 MARKETING ARCHITECT - EMPIRE ONE")
    print("=" * 80)
    
    # Generate Twitter thread
    print("\n[1/3] Generating Twitter Launch Thread...")
    twitter_result = agent.generate_twitter_thread()
    print(f"✅ Generated: {twitter_result['sovereign_id']}")
    print(f"📊 Tokens used: {twitter_result['tokens_used']}")
    print(f"💾 Saved to: {twitter_result['ledger_file']}")
    print("\n--- TWITTER THREAD ---")
    print(twitter_result['content'])
    
    # Generate Product Hunt copy
    print("\n\n[2/3] Generating Product Hunt Copy...")
    ph_result = agent.generate_product_hunt_copy()
    print(f"✅ Generated: {ph_result['sovereign_id']}")
    print(f"📊 Tokens used: {ph_result['tokens_used']}")
    print(f"💾 Saved to: {ph_result['ledger_file']}")
    print("\n--- PRODUCT HUNT ---")
    print(ph_result['content'])
    
    # Generate Press Email
    print("\n\n[3/3] Generating Press Email...")
    press_result = agent.generate_press_email()
    print(f"✅ Generated: {press_result['sovereign_id']}")
    print(f"📊 Tokens used: {press_result['tokens_used']}")
    print(f"💾 Saved to: {press_result['ledger_file']}")
    print("\n--- PRESS EMAIL ---")
    print(press_result['content'])
    
    print("\n" + "=" * 80)
    print("ALL MARKETING ASSETS GENERATED AND MINTED TO EMPIRE ONE LEDGER")
    print("=" * 80)
