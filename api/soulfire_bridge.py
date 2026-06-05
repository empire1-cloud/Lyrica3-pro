from .soulfire_engine import generate_soulfire

def generate_soulfire_payload(prompt, persona, dna, use_neural=True):
    return generate_soulfire(
        prompt=prompt,
        persona=persona,
        dna=dna,
        use_neural=use_neural
    )
