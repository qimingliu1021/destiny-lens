import axios from "axios";
import fs from "fs";

const API_KEY = "sk_cf601d77f9e51f876e1dd39d4399ece4b263189558099d2e"; // 🔒 Replace this with your real API key
const VOICE_ID = "s81iyjtwYqJ1l1FBPUxm";

const poemOfLife = `
Life is fleeting, like dew that vanishes at dawn.
In restless pursuit, people seek their answers.
Fate rises and falls like the surging sea,
While the palm's blurred lines trace a winding path.
`;

const poemOfCity = `
The city never sleeps, its lights a restless tide.
Streets pulse with stories, dreams and hope collide.
Steel and glass reach upward, chasing endless sky,
While footsteps echo futures as the days go by.
Washington Park Arboretum Morning dew hums to hearts that seek new spring,
Roots below whisper truths you've always known.

Volunteer Park Conservatory
Fern and glass hold silence like breath,
Grounding you in sunlight and stillness.

Olympic Sculpture Park
Steel and sky shape unspoken thought,
Art that echoes your unfolding path.

Mount Rainier
You climb not to conquer, but to see—
Above the clouds, your clarity waits.

Kubota Garden
Balance lives in bridge and stone,
A quiet call to feel at home.`;

// Combine the poems, life first, then city
const combinedText = poemOfLife + "\n" + poemOfCity;

async function generateSpeech() {
  try {
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      data: {
        text: combinedText,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      },
      responseType: "arraybuffer",
    });

    fs.writeFileSync("poem.mp3", response.data);
    console.log("✅ Audio saved as poem.mp3");
  } catch (error) {
    console.error(
      "❌ Failed to generate speech:",
      error.response?.data || error.message
    );
  }
}

generateSpeech();
