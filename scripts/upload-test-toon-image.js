const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upload() {
  // Read the generated test image
  const buffer = fs.readFileSync('test-toon.png');
  console.log('Image size:', (buffer.length / 1024).toFixed(1), 'KB');

  // Upload to Supabase Storage
  const filePath = 'toon-images/toon-test-ep001.png';
  const { error: uploadError } = await supabase.storage
    .from('ai-photos')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('ai-photos')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;
  console.log('Public URL:', publicUrl);

  // Update the first episode with toon_image_url
  const { data: ep } = await supabase
    .from('news_toon_episodes')
    .select('id')
    .order('episode_number', { ascending: true })
    .limit(1)
    .single();

  if (!ep) {
    console.log('No episode found');
    return;
  }

  const { error: updateError } = await supabase
    .from('news_toon_episodes')
    .update({ toon_image_url: publicUrl })
    .eq('id', ep.id);

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Episode updated with toon_image_url!');
  }
}

upload();
