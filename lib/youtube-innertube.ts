import { Innertube } from 'youtubei.js';

export async function getTranscriptWithInnertube(videoId: string): Promise<string> {
  try {
    console.log(`[Innertube] Starting transcript extraction for video: ${videoId}`);
    
    const youtube = await Innertube.create({
      cache: undefined as any, // Fix type issue
      generate_session_locally: true
    });
    
    // Get video info
    const info = await youtube.getInfo(videoId);
    console.log(`[Innertube] Video info retrieved: ${info.basic_info?.title}`);
    
    // Check if captions are available
    const captionTracks = info.captions?.caption_tracks;
    if (!captionTracks || captionTracks.length === 0) {
      console.log('[Innertube] No caption tracks found');
      throw new Error('No captions available for this video');
    }
    
    console.log(`[Innertube] Found ${captionTracks.length} caption track(s)`);
    
    // Find Korean or English caption track
    let selectedTrack = captionTracks.find(track => 
      track.language_code === 'ko' || track.language_code === 'ko-KR'
    ) || captionTracks.find(track => 
      track.language_code === 'en' || track.language_code === 'en-US'
    ) || captionTracks[0];
    
    console.log(`[Innertube] Selected track: ${selectedTrack.language_code} - ${selectedTrack.name?.text || selectedTrack.name}`);
    
    // Get transcript URL from the selected track
    const transcriptUrl = selectedTrack.base_url;
    if (!transcriptUrl) {
      console.log('[Innertube] No transcript URL in selected track');
      throw new Error('No transcript URL available');
    }
    
    console.log('[Innertube] Fetching transcript XML...');
    
    // Fetch transcript content
    const response = await fetch(transcriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }
    
    const transcriptXml = await response.text();
    console.log(`[Innertube] XML fetched, length: ${transcriptXml.length}`);
    
    // Parse XML to extract text (simple regex approach)
    const textMatches = transcriptXml.match(/<text[^>]*>([^<]+)<\/text>/g) || [];
    console.log(`[Innertube] Found ${textMatches.length} text segments`);
    
    if (textMatches.length === 0) {
      throw new Error('No text segments found in transcript XML');
    }
    
    const text = textMatches
      .map(match => {
        // Extract text content and decode HTML entities
        const textContent = match.replace(/<[^>]+>/g, '');
        return textContent
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, ' ');
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!text || text.length === 0) {
      throw new Error('Transcript is empty after parsing');
    }
    
    console.log(`[Innertube] Successfully extracted transcript, length: ${text.length}`);
    return text;
  } catch (error: any) {
    console.error('[Innertube] Error:', error.message);
    
    // Suppress parser warnings from youtubei.js
    if (error.message?.includes('not found!') || error.message?.includes('Type mismatch')) {
      // These are parser warnings, not critical errors
      console.log('[Innertube] Non-critical parser warning, ignoring...');
    }
    
    throw new Error(error.message || 'Failed to extract transcript with Innertube');
  }
}