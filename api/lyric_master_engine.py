"""Local-first lyric writing, revision, scoring, and Soulfire handoff for Lyrica 3."""
from __future__ import annotations

import hashlib
import json
import random
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

Mode = Literal["generate", "rewrite", "polish", "analyze"]
Language = Literal["en", "es", "bilingual"]
Perspective = Literal["first_person", "second_person", "third_person"]


class LyricMasterRequest(BaseModel):
    concept: str = Field(min_length=3, max_length=500)
    title: Optional[str] = Field(default=None, max_length=120)
    mode: Mode = "generate"
    existing_lyrics: Optional[str] = Field(default=None, max_length=20000)
    genre: str = Field(default="Contemporary R&B", max_length=80)
    mood: str = Field(default="honest", max_length=80)
    perspective: Perspective = "first_person"
    language: Language = "en"
    cultural_context: List[str] = Field(default_factory=list, max_length=12)
    structure: List[str] = Field(
        default_factory=lambda: [
            "verse_1", "pre_chorus", "chorus", "verse_2",
            "chorus", "bridge", "final_chorus",
        ],
        max_length=12,
    )
    rhyme_scheme: str = Field(default="ABAB", min_length=1, max_length=8)
    target_syllables: int = Field(default=10, ge=5, le=18)
    explicit: bool = False
    must_include: List[str] = Field(default_factory=list, max_length=20)
    avoid_phrases: List[str] = Field(default_factory=list, max_length=40)
    seed: int = Field(default=113, ge=0, le=2_147_483_647)
    creator_id: Optional[str] = Field(default=None, max_length=160)


class LyricLine(BaseModel):
    text: str
    section: str
    bar: int
    syllables: int
    rhyme_key: str
    lml_tags: List[str] = Field(default_factory=list)


class LyricSection(BaseModel):
    name: str
    lines: List[LyricLine]


class LyricQualityScores(BaseModel):
    overall: float
    hook_strength: float
    cohesion: float
    specificity: float
    singability: float
    rhyme_consistency: float
    emotional_arc: float
    originality: float
    cultural_grounding: float


class LyricMasterResponse(BaseModel):
    lyric_id: str
    title: str
    mode: Mode
    status: Literal["mastered", "needs_revision", "analyzed"]
    sections: List[LyricSection]
    lyrics_text: str
    soulfire_lyrics: List[Dict[str, Any]]
    scores: LyricQualityScores
    revision_notes: List[str]
    warnings: List[str]
    ownership_manifest: Dict[str, Any]
    generation_metadata: Dict[str, Any]


STOP = set("a an and are as at be been but by for from had has have i in is it me my of on or our that the their them they this to was we were with you your about song track".split())
GENERIC = set("love heart feel feeling thing things baby forever always never pain dream life world time".split())
DETAILS = "porch hallway dashboard rearview streetlight kitchen voicemail denim window asphalt candle receipt photograph freeway boulevard speaker cassette tattoo shoebox mirror requinto lowrider backyard radio sunset train phone".split()
COUNTS = {"intro": 2, "pre_chorus": 2, "post_chorus": 2, "outro": 2}

EN_GROUPS = [
    ["I carried {topic} past midnight into the light", "I kept {topic} breathing through the night", "The rearview held the truth just out of sight", "I said it plain and watched the whole room turn bright"],
    ["I stopped letting silence borrow my name", "I turned the last goodbye into a flame", "I pinned the honest version in a frame", "I came back different, never quite the same"],
    ["The dashboard glow kept leading me back home", "I learned how loud a quiet room can groan", "I built a steadier heart from brick and stone", "I kept the truth and left the fear alone"],
    ["The boulevard was humming soft and low", "I let the hardest part move slow", "The porch light caught a copper-colored glow", "I know exactly what I choose to know"],
    ["The window wrote your outline in the rain", "I stopped confusing memory with pain", "I broke the old excuse out of its chain", "I will not lose myself that way again"],
]
ES_GROUPS = [
    ["Llevé {topic} por la calle bajo el sol", "Guardé la verdad temblando en mi voz", "El retrovisor me devolvió quién soy", "Dije mi nombre y la noche contestó"],
    ["Ya no le presto mi silencio al dolor", "Hice de la despedida una canción", "Puse la verdad completa en el balcón", "Volví distinta, pero con el corazón"],
    ["La luz del tablero me llevó al hogar", "Aprendí que el cuarto también sabe hablar", "Con cada ladrillo me volví a levantar", "Dejé el miedo solo y elegí caminar"],
]
BILINGUAL = [
    "I kept {topic} close — no me voy a esconder",
    "Streetlights on the glass, ya aprendí a responder",
    "I say my name out loud, para volver a creer",
    "No borrowed voice tonight — this truth is mine to wear",
]
HOOKS = {
    "en": ["Say my name when the streetlights glow", "I choose the truth, even when it burns", "No more shrinking in the rearview light", "What I survived still belongs to me"],
    "es": ["Di mi nombre cuando encienda la ciudad", "Elijo la verdad aunque duela más", "Ya no me escondo detrás del retrovisor", "Lo que sobreviví también me pertenece"],
    "bilingual": ["Say my name — que lo escuche la ciudad", "I choose the truth, aunque duela de verdad", "No more hiding — ya regresé a mi voz", "What I survived, nadie me lo quitó"],
}
TAGS = {
    "intro": ["<close_mic>", "<breath_soft>"],
    "verse": ["<late_pocket>", "<chest_voice>"],
    "pre_chorus": ["<rising_tension>", "<breath_hold>"],
    "chorus": ["<open_chest>", "<double_vocal>"],
    "bridge": ["<vocal_fry>", "<emotional_crack>"],
    "outro": ["<close_mic>", "<tape_fade>"],
}


class LyricMasterEngine:
    version = "2.0.0"
    provider = "lyrica3:lyric-master-v2-local"

    def master(self, req: LyricMasterRequest) -> LyricMasterResponse:
        self._validate(req)
        rng = random.Random(self._seed(req))
        warnings = []
        if re.search(r"\b(in the style of|sound exactly like|write like)\b", req.concept, re.I):
            warnings.append("Artist imitation language was converted to neutral musical traits.")
        if req.explicit:
            warnings.append("Explicit mode does not inject slurs or targeted abuse.")

        if req.mode == "generate":
            sections = self._generate(req, rng)
        else:
            sections = self._parse(req.existing_lyrics or "")
            if req.mode in {"rewrite", "polish"}:
                sections = self._revise(sections, req, rng)

        scores = self._score(sections, req)
        text = self._render(sections)
        digest = hashlib.sha256(text.encode()).hexdigest()
        lyric_id = f"lyr_{digest[:16]}"
        status = "analyzed" if req.mode == "analyze" else ("mastered" if scores.overall >= .72 else "needs_revision")
        handoff = [
            {"text": l.text, "lml_tags": l.lml_tags, "section": l.section, "bar": l.bar, "syllables": l.syllables, "rhyme_key": l.rhyme_key}
            for s in sections for l in s.lines
        ]
        return LyricMasterResponse(
            lyric_id=lyric_id,
            title=req.title or " ".join(w.title() for w in self._content(req.concept)[:4]) or "Untitled Truth",
            mode=req.mode,
            status=status,
            sections=sections,
            lyrics_text=text,
            soulfire_lyrics=handoff,
            scores=scores,
            revision_notes=self._notes(scores, sections, req),
            warnings=warnings,
            ownership_manifest={
                "lyric_id": lyric_id,
                "creator_id": req.creator_id,
                "content_sha256": digest,
                "engine": self.provider,
                "engine_version": self.version,
                "external_api_used": False,
                "local_generation": True,
                "claim": "creator-controlled draft; ownership is finalized by the Lyrica/VICS proof flow",
            },
            generation_metadata={
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "genre": req.genre, "mood": req.mood, "language": req.language,
                "perspective": req.perspective, "rhyme_scheme": req.rhyme_scheme.upper(),
                "target_syllables": req.target_syllables, "seed": req.seed,
                "line_count": len(handoff), "section_count": len(sections),
                "compatibility": ["EFL", "LML", "PFA", "Soulfire", "VICS"],
            },
        )

    def _generate(self, req: LyricMasterRequest, rng: random.Random) -> List[LyricSection]:
        topic = " ".join(self._content(req.concept)[:4]) or "the truth"
        groups = ES_GROUPS if req.language == "es" else EN_GROUPS
        picked = rng.sample(groups, min(2, len(groups)))
        hook = rng.choice(HOOKS[req.language])
        if req.must_include and len(req.must_include[0].split()) <= 5:
            hook += f" — {req.must_include[0].strip()}"
        scheme = [c for c in req.rhyme_scheme.upper() if c.isalpha()] or list("ABAB")
        result = []
        include_cursor = 1 if req.must_include else 0

        for si, name in enumerate(req.structure):
            base = self._base(name)
            count = COUNTS.get(name, COUNTS.get(base, 4))
            lines = []
            for bar in range(1, count + 1):
                if base == "chorus" and bar in {1, 3}:
                    text = hook
                elif req.language == "bilingual" and (si + bar) % 2 == 0:
                    text = BILINGUAL[(si + bar) % len(BILINGUAL)].format(topic=topic)
                else:
                    gi = (ord(scheme[(bar - 1) % len(scheme)]) - 65) % len(picked)
                    group = picked[gi]
                    text = group[(si + bar - 1) % len(group)].format(topic=topic)
                if include_cursor < len(req.must_include) and bar == count:
                    phrase = req.must_include[include_cursor].strip()
                    include_cursor += 1
                    if phrase.lower() not in text.lower():
                        text += f" — {phrase}"
                text = self._perspective(text, req.perspective)
                text = self._clean(text, req.avoid_phrases)
                lines.append(self._line(text, name, bar, self._tags(base, si, bar, req.mood)))
            result.append(LyricSection(name=name, lines=lines))
        return result

    def _parse(self, text: str) -> List[LyricSection]:
        result, current, lines, bar = [], "verse_1", [], 1
        for raw in text.splitlines():
            value = raw.strip()
            if not value:
                continue
            heading = re.fullmatch(r"\[([^\]]+)\]", value)
            if heading:
                if lines:
                    result.append(LyricSection(name=current, lines=lines))
                current = self._normalize(heading.group(1)); lines = []; bar = 1
            else:
                lines.append(self._line(value, current, bar, self._tags(self._base(current), 0, bar, "honest"))); bar += 1
        if lines:
            result.append(LyricSection(name=current, lines=lines))
        return result or [LyricSection(name="verse_1", lines=[])]

    def _revise(self, sections: List[LyricSection], req: LyricMasterRequest, rng: random.Random) -> List[LyricSection]:
        topic = " ".join(self._content(req.concept)[:2]) or "the truth"
        output = []
        for si, section in enumerate(sections):
            lines = []
            for line in section.lines:
                words = self._words(line.text)
                ratio = sum(w in GENERIC for w in words) / max(1, len(words))
                text = self._clean(line.text, req.avoid_phrases)
                if req.mode == "rewrite" or ratio > .22 or len(words) < 4:
                    detail = rng.choice(DETAILS)
                    if req.language == "es": text = f"El {detail} guardó {topic}; yo seguí de pie"
                    elif req.language == "bilingual": text = f"The {detail} held {topic} — yo seguí de pie"
                    else: text = f"The {detail} held {topic}; I kept my word"
                lines.append(self._line(text, section.name, line.bar, self._tags(self._base(section.name), si, line.bar, req.mood)))
            output.append(LyricSection(name=section.name, lines=lines))
        return output

    def _score(self, sections: List[LyricSection], req: LyricMasterRequest) -> LyricQualityScores:
        lines = [l for s in sections for l in s.lines if l.text]
        if not lines:
            return LyricQualityScores(**{k: 0.0 for k in LyricQualityScores.model_fields})
        words = [w for l in lines for w in self._words(l.text)]
        chorus = [l.text.lower() for s in sections if self._base(s.name) == "chorus" for l in s.lines]
        hook = min(1., .45 + .2 * max(Counter(chorus).values(), default=0) + .03 * len(chorus))
        concept = set(self._content(req.concept))
        cohesion = min(1., .42 + sum(w in concept for w in words) / max(6, len(lines)))
        specificity = min(1., .38 + sum(w in DETAILS for w in words) / max(5, len(lines)))
        deviation = sum(abs(l.syllables - req.target_syllables) for l in lines) / len(lines)
        singability = max(0., min(1., 1 - deviation / max(6, req.target_syllables)))
        rhymes = Counter(l.rhyme_key for l in lines if l.rhyme_key)
        rhyme = min(1., .3 + sum(v for v in rhymes.values() if v > 1) / max(1, len(lines)))
        bases = {self._base(s.name) for s in sections}
        arc = min(1., .35 + .15 * len(bases & {"verse", "pre_chorus", "chorus", "bridge"}))
        unique = len(set(words)) / max(1, len(words)); generic = sum(w in GENERIC for w in words) / max(1, len(words))
        originality = max(0., min(1., .4 + .7 * unique - .8 * generic))
        context = set(self._content(" ".join(req.cultural_context)))
        cultural = .5 if not context else min(1., .4 + sum(w in context for w in words) / max(3, len(context)))
        vals = [hook, cohesion, specificity, singability, rhyme, arc, originality, cultural]
        overall = sum(v * w for v, w in zip(vals, [.18, .16, .14, .16, .10, .10, .12, .04]))
        return LyricQualityScores(
            overall=round(overall, 3), hook_strength=round(hook, 3), cohesion=round(cohesion, 3),
            specificity=round(specificity, 3), singability=round(singability, 3),
            rhyme_consistency=round(rhyme, 3), emotional_arc=round(arc, 3),
            originality=round(originality, 3), cultural_grounding=round(cultural, 3),
        )

    @staticmethod
    def _validate(req: LyricMasterRequest) -> None:
        if req.mode != "generate" and not (req.existing_lyrics or "").strip():
            raise ValueError(f"existing_lyrics is required for mode={req.mode}")
        if not req.structure:
            raise ValueError("structure must contain at least one section")
        bad = [s for s in req.structure if not re.fullmatch(r"[a-z][a-z0-9_]{1,30}", s)]
        if bad: raise ValueError(f"invalid section names: {', '.join(bad)}")

    @staticmethod
    def _seed(req: LyricMasterRequest) -> int:
        value = json.dumps([req.concept.lower(), req.genre.lower(), req.mood.lower(), req.language, req.seed])
        return int(hashlib.sha256(value.encode()).hexdigest()[:16], 16)

    @staticmethod
    def _words(text: str) -> List[str]: return re.findall(r"[a-záéíóúüñ']+", text.lower())
    @classmethod
    def _content(cls, text: str) -> List[str]: return list(dict.fromkeys(w for w in cls._words(text) if w not in STOP and len(w) > 2))

    @staticmethod
    def _base(name: str) -> str:
        v = name.lower()
        if "chorus" in v: return "chorus"
        if v.startswith("verse"): return "verse"
        if v.startswith("pre"): return "pre_chorus"
        if v.startswith("bridge"): return "bridge"
        if v.startswith("intro"): return "intro"
        if v.startswith("outro"): return "outro"
        return v

    @staticmethod
    def _normalize(name: str) -> str:
        v = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        return {"hook": "chorus", "refrain": "chorus", "prechorus": "pre_chorus"}.get(v, v or "verse_1")

    @staticmethod
    def _perspective(text: str, view: Perspective) -> str:
        if view == "first_person": return text
        pairs = {"I": "You", "my": "your", "me": "you", "myself": "yourself"} if view == "second_person" else {"I": "They", "my": "their", "me": "them", "myself": "themself"}
        for source, target in pairs.items(): text = re.sub(rf"\b{source}\b", target, text, flags=re.I)
        return text

    @staticmethod
    def _clean(text: str, avoid: List[str]) -> str:
        for phrase in sorted((p.strip() for p in avoid if p.strip()), key=len, reverse=True): text = re.sub(re.escape(phrase), "", text, flags=re.I)
        text = re.sub(r"\s+([,.;:!?])", r"\1", re.sub(r"\s{2,}", " ", text)).strip(" -—,.;")
        return text or "I kept the honest part and let the silence go"

    @classmethod
    def _line(cls, text: str, section: str, bar: int, tags: List[str]) -> LyricLine:
        return LyricLine(text=text, section=section, bar=bar, syllables=cls._syllables(text), rhyme_key=cls._rhyme(text), lml_tags=tags)

    @staticmethod
    def _tags(base: str, si: int, bar: int, mood: str) -> List[str]:
        tags = list(TAGS.get(base, ["<natural_phonation>"]))
        m = mood.lower()
        if any(w in m for w in ("grief", "sad", "loss", "vulnerable")): tags.append("<emotional_crack>")
        elif any(w in m for w in ("defiant", "angry", "fire", "aggressive")): tags.append("<controlled_grit>")
        if si > 4 or (base == "chorus" and bar >= 3): tags.append("<intensity_lift>")
        return list(dict.fromkeys(tags))

    @classmethod
    def _syllables(cls, text: str) -> int:
        total = 0
        for word in cls._words(text):
            groups = re.findall(r"[aeiouyáéíóúü]+", word)
            count = len(groups) - (1 if word.endswith("e") and len(groups) > 1 and not word.endswith(("le", "ue")) else 0)
            total += max(1, count)
        return total

    @classmethod
    def _rhyme(cls, text: str) -> str:
        words = cls._words(text)
        if not words: return ""
        match = re.search(r"([aeiouyáéíóúü][a-záéíóúüñ]*)$", words[-1])
        return (match.group(1) if match else words[-1][-3:])[-4:]

    @staticmethod
    def _render(sections: List[LyricSection]) -> str:
        return "\n\n".join(f"[{s.name.replace('_', ' ').title()}]\n" + "\n".join(l.text for l in s.lines) for s in sections).strip()

    @staticmethod
    def _notes(scores: LyricQualityScores, sections: List[LyricSection], req: LyricMasterRequest) -> List[str]:
        notes = []
        if scores.hook_strength < .7: notes.append("Repeat one concise chorus line at least twice to strengthen recall.")
        if scores.specificity < .65: notes.append("Replace abstract emotion words with one place, object, action, or sensory detail.")
        if scores.singability < .7: notes.append(f"Tighten long bars toward about {req.target_syllables} syllables.")
        if scores.rhyme_consistency < .6: notes.append(f"Clarify the requested {req.rhyme_scheme.upper()} end-rhyme pattern.")
        if not any(LyricMasterEngine._base(s.name) == "bridge" for s in sections): notes.append("Add a bridge that changes the emotional angle.")
        return notes or ["Master pass cleared: structure, hook, imagery, meter, and handoff data are coherent."]


def create_lyric_master_router(engine: Optional[LyricMasterEngine] = None) -> APIRouter:
    router = APIRouter(prefix="/lyrics", tags=["lyric-master"])
    engine = engine or LyricMasterEngine()

    @router.get("/capabilities")
    async def capabilities() -> Dict[str, Any]:
        return {"engine": engine.provider, "version": engine.version, "modes": ["generate", "rewrite", "polish", "analyze"], "languages": ["en", "es", "bilingual"], "external_api_required": False, "handoff": ["EFL", "LML", "PFA", "Soulfire", "VICS"]}

    @router.post("/master", response_model=LyricMasterResponse)
    async def master_lyrics(request: LyricMasterRequest) -> LyricMasterResponse:
        try: return engine.master(request)
        except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc

    return router
