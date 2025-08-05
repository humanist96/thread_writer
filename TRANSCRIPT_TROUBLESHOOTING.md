# YouTube Transcript Extraction Troubleshooting Guide

## Common Issues and Solutions

### 1. "This video does not have captions available"

**Symptoms:**
- Error appears immediately after selecting a video
- Video plays fine on YouTube but transcript extraction fails

**Causes:**
- Video doesn't have any captions (neither auto-generated nor manual)
- Captions are disabled by the video owner
- The video is too new and YouTube hasn't generated auto-captions yet

**Solutions:**
1. Check if the video has the "CC" button on YouTube
2. Try enabling auto-generated captions on YouTube first
3. Select a different video that has captions available
4. For Korean videos, ensure Korean captions are available

### 2. "This video is unavailable or private"

**Symptoms:**
- Error indicates the video cannot be accessed
- Video might be region-locked or private

**Solutions:**
1. Verify the video is publicly accessible in your region
2. Check if the video requires age verification
3. Try using a different video from the same channel
4. Ensure the video URL/ID is correct

### 3. Timeout Errors

**Symptoms:**
- Request takes longer than 30 seconds
- Error message about timeout

**Causes:**
- Very long videos with extensive transcripts
- Network connectivity issues
- YouTube API rate limiting

**Solutions:**
1. Try shorter videos (under 30 minutes)
2. Check your internet connection
3. Wait a few minutes before retrying (rate limiting)
4. Use the debug endpoint to check success rates

### 4. Korean Content Issues

**Symptoms:**
- Korean videos failing more often
- Garbled text in transcripts

**Solutions:**
1. Ensure the video has Korean captions (not just auto-translated)
2. Check if the Korean text is displaying correctly in the UI
3. The system automatically detects Korean content - check metrics

## Testing and Debugging

### Using the Debug Endpoint

Access transcript extraction metrics:
```
GET http://localhost:3006/api/transcript/debug
```

This shows:
- Overall success rate
- Method-specific success rates
- Korean content success rate
- Average response times
- Last error messages

### Manual Testing

Run the manual test script:
```bash
cd youtube-ai-thread
node manual-test.js
```

**Note**: 자막 추출은 한도가 있으니 꼭 테스트가 필요할때 한 번씩만 수행해

### Unit Tests

Run the test suite:
```bash
npm test
```

For continuous testing:
```bash
npm run test:watch
```

## Architecture Overview

The transcript extraction system uses multiple fallback methods:

1. **Primary Method**: `youtube-transcript` npm package
   - Fastest and most reliable
   - Works with most public videos with captions

2. **Fallback 1**: `yt-dlp` integration
   - More robust but requires external binary
   - Can extract subtitles in multiple formats

3. **Fallback 2**: YouTube Data API v3
   - Requires OAuth for full functionality
   - Limited without authentication

## Performance Optimization

### Caching Strategy
- Consider implementing Redis caching for frequently accessed videos
- Cache transcripts for 24 hours
- Implement cache invalidation for updated videos

### Rate Limiting
- YouTube API has quotas - monitor usage
- Implement request queuing for high traffic
- Add user-based rate limiting

### Monitoring
- Use the transcript monitor to track performance
- Set up alerts for low success rates
- Monitor Korean content separately

## Best Practices

1. **Always check for captions first**: Save API calls by checking if captions exist
2. **Handle errors gracefully**: Provide helpful error messages to users
3. **Test with diverse content**: Include different languages, video lengths, and types
4. **Monitor success rates**: Use the debug endpoint to track performance
5. **Respect rate limits**: Don't overwhelm YouTube's services

## Error Messages Reference

| Error Message | Meaning | User Action |
|--------------|---------|-------------|
| "No transcript available for this video" | No captions found | Select different video |
| "Could not find transcript" | youtube-transcript failed | Will try fallback methods |
| "Video unavailable" | Video is private/deleted | Check video accessibility |
| "Request timeout" | Took too long | Try shorter video |
| "Invalid video ID" | Malformed video ID | Check video URL |

## Contact

For persistent issues:
1. Check the debug metrics
2. Review server logs
3. Test with known working videos
4. Ensure all environment variables are set correctly