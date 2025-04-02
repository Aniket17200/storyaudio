import express from 'express';
import bodyParser from 'body-parser';
import JSZip from 'jszip';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import { createClient } from '@supabase/supabase-js';

dotenv.config(); // Load environment variables

// Initialize Supabase client using environment variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS
app.use(bodyParser.json());

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    // Fetch the zip file from the external API
    const response = await fetch(process.env.EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error('Failed to fetch from external API.');
      return res.status(500).json({ error: 'Failed to fetch from external API' });
    }

    // Unzip the response
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract image and audio files
    const imageFile = Object.keys(zip.files).find((file) => file.endsWith('.png'));
    const audioFile = Object.keys(zip.files).find((file) => file.endsWith('.mp3'));

    if (!imageFile || !audioFile) {
      return res.status(400).json({ error: 'Zip file does not contain required files' });
    }

    const imageBlob = await zip.files[imageFile].async('nodebuffer');
    const audioBlob = await zip.files[audioFile].async('nodebuffer');

    // Upload image to Supabase (image bucket)
    const { data: imageData, error: imageError } = await supabase.storage
      .from('image')
      .upload(`images/${Date.now()}_${imageFile}`, imageBlob, {
        contentType: 'image/png',
      });

    if (imageError) {
      console.error('Error uploading image:', imageError);
      return res.status(500).json({ error: 'Failed to upload image to Supabase' });
    }

    // Upload audio to Supabase (audio bucket)
    const { data: audioData, error: audioError } = await supabase.storage
      .from('audio')
      .upload(`audio/${Date.now()}_${audioFile}`, audioBlob, {
        contentType: 'audio/mpeg',
      });

    if (audioError) {
      console.error('Error uploading audio:', audioError);
      return res.status(500).json({ error: 'Failed to upload audio to Supabase' });
    }

    // Respond with the Supabase URLs
    res.json({
      imageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/image/${imageData.path}`,
      audioUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/audio/${audioData.path}`,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
