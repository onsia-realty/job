import { GoogleGenAI } from '@google/genai';
import type { AiPhotoStyle } from './ai-photo-styles';

export type { AiPhotoStyle };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================================
// 공통 제약 조건 (모든 스타일에 적용)
// ============================================================
const IDENTITY_PRESERVATION = `
## CRITICAL - Identity Preservation Rules (MUST FOLLOW):
- ABSOLUTELY NO structural changes to facial features: eye shape, eye size, nose bridge, nose tip, lip shape, lip thickness, jawline, chin shape, cheekbone position, ear shape must remain IDENTICAL to the original photo.
- Preserve the exact face-to-head ratio, eye spacing (interpupillary distance), and facial symmetry.
- Skin tone must match the original exactly - do NOT lighten or darken the overall skin color.
- Preserve all unique facial characteristics: moles, dimples, facial hair patterns, eyebrow shape and thickness.
- The generated face must be immediately recognizable as the same person by anyone who knows them.
- Do NOT apply any face-slimming, eye-enlarging, nose-narrowing, or any cosmetic surgery-like modifications.
`;

const SKIN_QUALITY = `
## Skin Quality - K-Beauty Standard:
- Smooth but realistic skin texture following K-beauty standards: clean, clear, porcelain-like skin with natural luminosity.
- Remove minor blemishes (acne, temporary marks, redness) but preserve permanent features (moles, beauty marks, freckles if prominent).
- Even skin tone with subtle natural translucency - NOT plastic or overly airbrushed.
- Subtle healthy glow on cheeks and nose bridge, natural skin sheen.
- Pores should be minimized but not completely erased - maintain realistic skin feel.
- Under-eye circles should be naturally reduced but not completely removed.
`;

const PHOTO_SPECS = `
## Technical Specifications:
- Output: 3:4 portrait ratio (standard Korean ID/profile photo ratio).
- Crop: Head and upper shoulders, top of head has ~15% margin from top edge, chin at approximately 65-70% from top.
- Shoulder line visible and straight/symmetrical at the bottom of the frame.
- Eyes positioned at approximately 1/3 from the top of the frame.
- Face centered horizontally with minimal tilt (within 3 degrees).
- Ultra-high resolution, tack-sharp focus on the eyes and face, slight natural depth-of-field on shoulders.
- Final image should look like it was taken by a professional portrait photographer in a high-end studio.
`;

// ============================================================
// 스타일별 프롬프트 변형 (랜덤 선택)
// ============================================================
const STYLE_PROMPT_VARIANTS: Record<AiPhotoStyle, string[]> = {
  BUSINESS_SUIT: [
    // Variant A: Classic Navy
    `Transform this person's photo into a premium Korean corporate headshot photo, as if taken at a top-tier professional photo studio.

## Clothing & Styling:
- Dark navy blue business suit (single-breasted, 2-button) with a crisp white dress shirt, well-fitted on the shoulders.
- Men: conservative solid navy or dark burgundy silk tie with a subtle pattern, neatly knotted Windsor or half-Windsor. Clean-shaven or very neatly trimmed facial hair.
- Women: tailored blazer over a high-neckline white or ivory silk blouse, small pearl or silver stud earrings, no necklace or a very delicate chain.
- Hair professionally styled: Men - neatly combed side-part or clean swept-back style. Women - sleek straight or soft waves, hair away from face.

## Background & Lighting:
- Clean, seamless gradient background from light gray (#E8E8E8) at edges to near-white (#F5F5F5) at center.
- Professional Rembrandt lighting setup: key light at 45 degrees creating a subtle triangular highlight on the shadow-side cheek.
- Fill light at 30% intensity to soften shadows without eliminating them - creates depth and authority.
- Hair light from above-behind to separate subject from background and add dimension.
- Catchlights visible in both eyes (dual catchlight from key + fill).

## Expression & Mood:
- Confident, trustworthy expression with a slight closed-mouth smile (Mona Lisa smile).
- Eyes looking directly at camera with steady, assured gaze.
- Chin slightly raised (2-3 degrees) to project confidence.
- Relaxed but squared shoulders conveying professionalism.`,

    // Variant B: Charcoal Gray
    `Transform this person's photo into an elite Korean business portrait photo suitable for a Fortune 500 company profile.

## Clothing & Styling:
- Charcoal gray (dark heather) wool-blend business suit, impeccably tailored with clean shoulder line.
- Men: light blue dress shirt with a charcoal and silver diagonal-striped tie, silver tie bar. Well-groomed appearance.
- Women: structured charcoal blazer with a soft cream or light pink round-neck shell top, small diamond or crystal stud earrings.
- Hair immaculately styled with no flyaways - polished, executive-level grooming.

## Background & Lighting:
- Smooth studio background in cool neutral gray (#D9DDE1) with very subtle vignetting at corners.
- Split Rembrandt lighting: key light slightly higher at 50 degrees for more dramatic corporate look.
- Soft fill light to maintain detail in shadow areas.
- Rim light on shoulder edge for professional depth separation.
- Even, controlled lighting that conveys precision and competence.

## Expression & Mood:
- Poised, professional expression with a subtle warm smile showing just a hint of upper teeth.
- Direct eye contact conveying reliability and leadership.
- Slight head tilt (5 degrees) toward key light for natural, approachable feel.
- Posture upright with shoulders back - confident executive presence.`,

    // Variant C: Premium Black
    `Transform this person's photo into a high-end Korean executive headshot photo, the kind used for board of directors profiles.

## Clothing & Styling:
- Black or very dark charcoal premium business suit with a fine pinstripe barely visible, sharp tailoring.
- Men: pristine white French-cuff dress shirt, deep blue or dark red solid silk tie, understated elegance. Clean, sharp grooming.
- Women: black structured blazer with a white or soft ivory V-neck blouse, pearl drop earrings, minimal but elegant.
- Every detail polished: lint-free suit, crisp collar, perfectly aligned tie.

## Background & Lighting:
- Premium gradient background from medium gray (#C0C0C0) at edges to lighter center, studio-grade seamless paper look.
- Classic loop lighting: key light positioned to create a small shadow from the nose angled toward the cheek.
- Fill light ratio 1:3 for dimensional but flattering result.
- Background light to prevent subject merging with backdrop.
- Specular highlights on suit shoulders and tie for premium material feel.

## Expression & Mood:
- Dignified, composed expression with a genuine but restrained smile.
- Eyes sharp and engaged, projecting intelligence and warmth.
- Face oriented straight to camera with very minimal tilt.
- Shoulders squared and relaxed - effortless authority.`,
  ],

  ANNOUNCER: [
    // Variant A: Warm Glamour
    `Transform this person into a glamorous Korean TV news anchor portrait photo, as seen on major broadcast network profiles (KBS, MBC, SBS announcer style).

## Clothing & Styling:
- Women: elegant jewel-toned solid blouse (royal blue, deep coral, or emerald green) OR fitted tailored jacket in a rich color, statement gold or pearl necklace, refined drop earrings that catch light. Subtle but visible makeup enhancement.
- Men: perfectly tailored dark navy or black suit, crisp white shirt with a bold-colored tie (bright blue, warm red, or purple), optional pocket square with coordinating color.
- Hair: broadcast-ready perfection - Women: voluminous blowout, soft defined waves or sleek straight with shine. Men: perfectly styled with clean lines, slight volume on top.

## Background & Lighting:
- Soft gradient background in warm neutral tone (warm beige to cream) OR subtle blue-gray broadcast studio feel.
- Butterfly (Paramount) lighting: key light positioned directly in front and above, creating a small shadow under the nose and even illumination across both cheeks.
- Large soft fill from below to eliminate ALL harsh shadows - the "flat but luminous" broadcast look.
- Hair light for glossy, healthy hair appearance.
- Overall bright, high-key lighting that creates a glowing, telegenic complexion.

## Expression & Mood:
- Bright, warm, camera-ready smile showing top teeth naturally - the kind that makes viewers trust and like you.
- Sparkling, alert eyes with energy and enthusiasm.
- Head tilted very slightly (3-5 degrees) for approachability.
- Open, inviting body language with shoulders turned very slightly (10 degrees) from camera.`,

    // Variant B: Elegant Professional
    `Transform this person into a refined Korean broadcast journalist portrait, with the polished elegance of a prime-time anchor.

## Clothing & Styling:
- Women: sophisticated wrap-style blouse or structured peplum top in a warm autumn tone (dusty rose, warm terracotta, or deep wine), delicate layered necklace, small elegant hoop or stud earrings.
- Men: charcoal suit with subtle texture, sky blue or lavender dress shirt, silk tie in a complementary warm tone, perfectly dimpled tie knot.
- Grooming at the highest level: every hair in place, eyebrows groomed, skin flawless.

## Background & Lighting:
- Clean soft background with gentle warm color wash - subtle peach or golden undertone.
- Modified butterfly lighting with slight offset (10 degrees) for dimension while maintaining brightness.
- Large octabox key light for ultra-soft, wrap-around illumination on the face.
- Kicker light on one side for subtle edge definition and glamour.
- Catch light reflectors to create bright, lively eyes.

## Expression & Mood:
- Elegant, measured smile - warm but with gravitas, like delivering good news.
- Eyes conveying intelligence, empathy, and professionalism simultaneously.
- Chin level with the ground for a balanced, authoritative yet friendly look.
- Slight lean forward to convey engagement and interest.`,

    // Variant C: Modern Broadcast
    `Transform this person into a modern Korean entertainment/news anchor portrait with contemporary broadcast styling.

## Clothing & Styling:
- Women: modern asymmetric neckline top or structured mock-neck in a vibrant solid color (cobalt blue, hot pink, or tangerine), geometric statement earrings, bold but tasteful accessory.
- Men: slim-fit modern dark suit, open-collar dress shirt (no tie) OR turtleneck under blazer for contemporary look, clean modern watch visible.
- Contemporary styling: fresh, trendy but still broadcast-appropriate - the modern anchor look.

## Background & Lighting:
- Clean contemporary background - soft cool gray with a subtle blue or teal accent gradient.
- Three-point broadcast lighting: bright key light, strong fill (ratio 1:1.5) for the flat, even broadcast standard.
- LED ring catch lights in eyes for the modern digital broadcast look.
- Color-corrected to broadcast standards - vivid but natural colors.
- Overall high-key, bright, and punchy color palette.

## Expression & Mood:
- Dynamic, charismatic smile - the kind that lights up a screen.
- Confident, forward-looking gaze with a spark of excitement.
- Slight asymmetry in expression for natural, unposed feel.
- Energetic but controlled posture.`,
  ],

  CASUAL: [
    // Variant A: Warm Cafe
    `Transform this person into a warm, approachable smart-casual Korean business portrait - the style used by startup founders, IT professionals, and creative industry workers on LinkedIn.

## Clothing & Styling:
- Men: clean, well-fitted crew-neck merino wool sweater in a warm tone (camel, oatmeal, heather gray, or soft navy), no tie, no visible shirt collar. Neat, natural grooming.
- Women: soft knit V-neck or boat-neck top in a warm neutral or pastel (cream, dusty pink, sage green, soft lavender), minimal jewelry - perhaps a thin gold chain or small hoop earrings.
- Natural, effortless grooming: hair styled but not stiff - the "I woke up looking this good" effect.

## Background & Lighting:
- Warm, blurred background suggesting a modern cafe or co-working space - soft bokeh with warm amber/golden tones, out-of-focus shelves or plants barely visible.
- Natural window light from one side (simulate large window at 3 o'clock position), warm color temperature (4000K-4500K).
- Gentle fill from ambient room light on shadow side.
- No artificial-looking studio lighting - everything should feel naturally lit.
- Soft golden-hour warmth in the overall color grade.

## Expression & Mood:
- Genuine, relaxed smile that reaches the eyes (Duchenne smile) - like talking to a friend.
- Warm, open eyes with a friendly, approachable gaze.
- Slight natural head tilt showing ease and comfort.
- Relaxed shoulders, slightly asymmetric posture for natural feel.`,

    // Variant B: Modern Office
    `Transform this person into a modern professional casual portrait - clean and polished but with relaxed energy, like a tech company or design agency team photo.

## Clothing & Styling:
- Men: neat polo shirt in a solid rich color (navy, forest green, or slate blue) OR a clean henley/mock-neck in neutral tone. Well-fitted, no wrinkles.
- Women: stylish blouse with subtle pattern or texture in a flattering color, or a clean structured t-shirt with a cardigan. Simple stud earrings or no jewelry.
- Smart but uncomplicated - the confident simplicity of someone who doesn't need a suit to look professional.

## Background & Lighting:
- Softly blurred modern office or creative workspace background - hints of white walls, green plants, and warm wood tones in soft bokeh.
- Diffused natural light feel - overcast window light, even and soft across the face.
- Very subtle rim light on one side for depth separation from background.
- Clean, modern color grading - slightly desaturated with lifted shadows for contemporary feel.
- Overall bright but not harsh - airy and fresh.

## Expression & Mood:
- Friendly, confident half-smile - approachable and competent.
- Direct but relaxed eye contact - "I'm easy to work with."
- Natural, unstiff posture with body turned 15-20 degrees from camera, face toward camera.
- Overall vibe: "I'm great at my job and also a cool person."`,

    // Variant C: Clean Minimal
    `Transform this person into a clean, minimal Korean professional portrait with Scandinavian-inspired simplicity - popular among designers, consultants, and modern professionals.

## Clothing & Styling:
- Men: premium plain white or light gray t-shirt visible under a well-cut navy or black blazer (casual blazer, not suit jacket), clean and minimal.
- Women: simple high-quality round-neck or slight V-neck top in white, black, or soft neutral, optional lightweight blazer. One delicate accessory at most.
- Minimal, deliberate styling - every element intentional, nothing excessive.

## Background & Lighting:
- Clean, soft cream or warm white background - almost seamless but with a very subtle warmth, not clinical white.
- Soft, diffused lighting that mimics a north-facing window - even, gentle, and flattering.
- Minimal shadows, open and bright feel.
- Color grade: warm neutrals, slightly lifted blacks, natural skin tones with gentle warmth.
- The aesthetic of a high-end brand lookbook - clean, fresh, effortless.

## Expression & Mood:
- Calm, genuine smile with quiet confidence - not trying too hard.
- Relaxed, present gaze - thoughtful and authentic.
- Face straight or with very slight natural tilt.
- Minimalist energy: composed, modern, trustworthy.`,
  ],
};

// ============================================================
// 프롬프트 조합 함수
// ============================================================
function buildPrompt(style: AiPhotoStyle): string {
  const variants = STYLE_PROMPT_VARIANTS[style];
  const randomIndex = Math.floor(Math.random() * variants.length);
  const stylePrompt = variants[randomIndex];

  return `${stylePrompt}

${IDENTITY_PRESERVATION}
${SKIN_QUALITY}
${PHOTO_SPECS}

## Final Instruction:
Generate a single transformed portrait photo. The result must look like a real photograph taken by a professional photographer - NOT like an AI-generated image, NOT like a painting or illustration. Photorealistic quality is mandatory.`;
}

// ============================================================
// Gemini API 호출
// ============================================================
interface GenerateResult {
  imageBuffer: Buffer;
  mimeType: string;
  generationTimeMs: number;
}

export async function generateAiPhoto(
  imageBuffer: Buffer,
  mimeType: string,
  style: AiPhotoStyle
): Promise<GenerateResult> {
  const startTime = Date.now();

  const base64Image = imageBuffer.toString('base64');
  const prompt = buildPrompt(style);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseModalities: ['image', 'text'],
    },
  });

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw new Error('AI_SAFETY_BLOCKED');
  }

  const parts = candidate?.content?.parts;
  if (!parts) {
    throw new Error('AI_NO_RESPONSE');
  }

  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) {
    const textPart = parts.find((p: any) => p.text);
    if (textPart?.text?.toLowerCase().includes('cannot') || textPart?.text?.toLowerCase().includes('sorry')) {
      throw new Error('AI_SAFETY_BLOCKED');
    }
    throw new Error('AI_NO_IMAGE');
  }

  const generatedBuffer = Buffer.from(imagePart.inlineData.data!, 'base64');
  const generationTimeMs = Date.now() - startTime;

  return {
    imageBuffer: generatedBuffer,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    generationTimeMs,
  };
}
