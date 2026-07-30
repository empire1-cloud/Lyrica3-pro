# Cultura Vocal Forge Language and Pronunciation Ethics

## Product decision

Vocal Forge will support English, Spanish, intentional Spanglish, Caló, and specific Nahuatl languages or variants without flattening them into a generic bilingual preset.

The system treats pronunciation as one part of cultural integrity. Correct phonemes do not automatically establish meaning, attribution, consent, community authority, training rights, or permission to commercialize ceremonial and sacred language.

## Why this exists

The founder study guide establishes several product requirements:

- Code-switching is a sophisticated bicultural language behavior, not defective Spanish or English.
- Linguistic borrowing is different from code-switching and must be represented separately.
- Caló is culturally situated Chicano language and must not be automatically “corrected” into institutional Spanish.
- Chicano Soul is a bicultural musical grammar shaped through African American R&B, Mexican musical expression, barrio experience, and Chicano identity.
- AI systems can reproduce surface sound while erasing context, community authority, lineage, and compensation.
- Dataset inclusivity matters because Western-only assumptions can make music-analysis and generation systems culturally blind.
- Provenance technology can document creative lineage, but it cannot grant cultural permission by itself.

## Implemented API

The Duo-Soul application is mounted by the Lyrica backend under `/duo-soul`.

```http
GET /duo-soul/cultura/pronunciation/capabilities
POST /duo-soul/cultura/pronunciation/validate
POST /duo-soul/cultura/release-language-gate
```

Both validation endpoints accept the same structured pronunciation plan and return:

- language-behavior analysis;
- token-level findings;
- release checks;
- review items;
- hard blocks;
- a deterministic plan digest;
- an honest `release_eligible` result.

## Spanglish and code-switching

Vocal Forge preserves intentional language boundaries. A line can contain English, Spanish, and a creator-designated Spanglish segment without being translated into one language or labeled grammatically defective.

The system records two independent facts:

1. **Code-switching present** — the line alternates between English and Spanish, or contains an explicitly designated Spanglish segment.
2. **Linguistic borrowing present** — a word has been adapted into another language’s phonetic or grammatical system.

This prevents a borrowed barrio form such as a creator-approved Caló expression from being mistaken for ordinary code-switching or silently normalized.

## Caló protection

Caló tokens preserve their creator-supplied surface forms by default. A release can pass with Caló when:

- the cultural context is documented;
- the creator’s wording remains intact;
- attribution is present; and
- no automatic normalization is requested.

Vocal Forge can flag a proposed rewrite for review, but it does not decide that institutional Spanish is inherently more correct or authentic.

## Nahuatl pronunciation gate

Nahuatl is a language collective rather than one uniform pronunciation target. Every release-bound Nahuatl token or phrase must therefore include:

- a specific language or variant rather than generic “Nahuatl” where possible;
- an IPA transcription;
- an explicit vowel-length declaration;
- an explicit saltillo or glottal-behavior declaration;
- a traceable linguistic or community source;
- approved human pronunciation review;
- cultural context and attribution; and
- traceable community review for heritage, ceremonial, sacred, or otherwise sensitive use.

A Wikipedia tracking category may help discover pages containing Nahuatl IPA, but it is not release-grade pronunciation evidence. The category currently describes itself as an automatically populated maintenance index, advises replacing the collective `nah` code with more specific language codes where possible, and lists approximately 253 pages plus a Classical Nahuatl subcategory. Its entries must be resolved to specific sources and reviewed rather than scraped into a voice model.

## Sacred and ceremonial material

Material marked `ceremonial` or `sacred` is blocked unless the plan includes a permission reference. IPA accuracy, a public dictionary, or a creator’s technical ability to synthesize the words cannot override the permission gate.

A rejected community review is also a hard block. The system does not convert disagreement into a lower confidence score and continue anyway.

## Training and reuse boundary

A phrase used only for one release can remain outside model training. When cultural or linguistic contributions are proposed as reusable training assets, the plan must show:

- licensed or community-approved training rights; and
- a contributor compensation plan.

`unknown` or `unlicensed` training status blocks the plan. A technical export, DNA identifier, Soulprint, or VICS proof can record what happened, but it does not repair missing consent or compensation.

## Relationship to Lyrica proof systems

The language gate complements rather than replaces Lyrica’s existing proof chain:

```text
creator intent
  -> Cultura language and pronunciation review
  -> final lyric and performance plan
  -> rendered audio
  -> DNA + Soulprint
  -> VICS proof
  -> catalog registration
  -> Archisynapse royalty receipt
```

The Cultura gate answers: **Was the language used with documented accuracy, context, attribution, rights, review, and permission?**

DNA, Soulprint, and VICS answer: **Which artifact was created, how is it identified, and can its lineage be verified?**

Archisynapse answers: **Was the resulting economic event authorized, recorded, and receipted?**

None of those layers should impersonate the authority of the others.

## Example: approved Nahuatl heritage phrase

```json
{
  "lyric_line": "Carry the xochitl home",
  "tokens": [
    {"text": "Carry the", "language": "english"},
    {
      "text": "xochitl",
      "language": "nahuatl",
      "ipa": "ˈʃoːtʃitɬ",
      "nahuatl_variant": "Classical Nahuatl",
      "vowel_length_handling": "marked",
      "saltillo_handling": "not_present",
      "source": {
        "kind": "community_speaker",
        "title": "Community pronunciation review",
        "locator": "review:cultura-nahuatl-001",
        "license_or_permission": "Approved for this release"
      },
      "human_pronunciation_review": "approved"
    },
    {"text": "home", "language": "english"}
  ],
  "cultural_context": "The flower image is used as an attributed heritage reference, not as ceremonial language.",
  "sensitivity": "heritage",
  "community_review": "approved",
  "community_reviewer_reference": "reviewer:cultura-community-001",
  "attribution_note": "Pronunciation and context reviewed with the named community contributor.",
  "reuse_mode": "single_release",
  "training_data_status": "not_used"
}
```

## Truth boundaries

- The implementation is a policy and evidence gate; it is not yet a complete multilingual phoneme-to-audio renderer.
- IPA supplied by a user or source is not automatically assumed correct.
- “Community approved” must point to a real review record; the API does not fabricate one.
- A generic reference page can support discovery but cannot close a release gate.
- No claim is made that one Nahuatl variant represents all Nahuatl-speaking communities.
- No claim is made that technical provenance alone protects intangible cultural heritage.
