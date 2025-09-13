# Auto-Feedback Generation System

## Overview

The Auto-Feedback Generation System is a background service that automatically generates 20 feedback entries for businesses when they have fewer than 5 feedback entries for a particular language. This system runs as a cron job and ensures that businesses always have sufficient feedback content available for their customers.

## Key Features

- **Automatic Detection**: Monitors feedback count per business-language combination
- **Threshold-Based Generation**: Triggers when feedback count < 5
- **Bulk Generation**: Creates 20 new feedbacks per trigger
- **Multi-Language Support**: Works with English, Hindi, and Gujarati
- **AI-Powered**: Uses OpenRouter API for natural feedback generation
- **Template Fallback**: Uses pre-defined templates when AI is unavailable
- **Background Processing**: Runs without affecting frontend performance
- **Batch Processing**: Handles multiple businesses efficiently

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cron Job      │───▶│  Auto-Feedback   │───▶│   Database      │
│   Scheduler     │    │     Service      │    │   Updates       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   AI Service     │
                       │  (OpenRouter)    │
                       └──────────────────┘
```

## Database Schema Changes

### Updated business_feedbacks Table

```sql
-- Add language support to business_feedbacks table
ALTER TABLE business_feedbacks 
ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_business_feedbacks_language 
ON business_feedbacks(business_id, language_code);
```

## Implementation Components

### 1. Auto-Feedback API Endpoint
- **File**: `src/app/api/auto-feedback-generator/route.ts`
- **Purpose**: Manual trigger for auto-feedback generation
- **Method**: POST
- **Response**: Generation statistics and results

### 2. Cron Service Class
- **File**: `src/lib/auto-feedback-cron.ts`
- **Purpose**: Core business logic for auto-feedback generation
- **Features**: 
  - Singleton pattern for single instance
  - Batch processing with delays
  - AI and template fallback
  - Error handling and logging

### 3. Cron API Endpoint
- **File**: `src/app/api/cron/auto-feedback/route.ts`
- **Purpose**: Endpoint for external cron services
- **Security**: Bearer token authentication
- **Methods**: POST (trigger), GET (status)

### 4. Standalone Cron Script
- **File**: `scripts/auto-feedback-cron.js`
- **Purpose**: Node.js script for system cron jobs
- **Usage**: Can be added to system crontab
- **Features**: Timeout handling, error logging

## Setup Instructions

### 1. Database Migration

Run the database migration to add language support:

```bash
# Apply the schema changes
psql -d your_database -f add-language-support-to-feedbacks.sql
```

### 2. Environment Variables

Add these environment variables to your `.env` file:

```env
# Required for AI generation (optional - will use templates if not provided)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Security token for cron endpoint
CRON_SECRET_TOKEN=your_secret_token_here

# Required: Your application URL
NEXTAUTH_URL=https://your-domain.com
```

### 3. Cron Job Setup Options

#### Option A: External Cron Service (Recommended for Production)

Use services like Vercel Cron, GitHub Actions, or cron-job.org:

```bash
# Example: Call the API endpoint every 6 hours
curl -X POST "https://your-domain.com/api/cron/auto-feedback" \
  -H "Authorization: Bearer your_secret_token" \
  -H "Content-Type: application/json"
```

#### Option B: System Cron Job

Add to your system crontab:

```bash
# Edit crontab
crontab -e

# Add this line to run every 6 hours
0 */6 * * * /usr/bin/node /path/to/your/project/scripts/auto-feedback-cron.js
```

#### Option C: npm Script

Run manually or from another script:

```bash
npm run auto-feedback-cron
```

### 4. Vercel Cron Configuration

If using Vercel, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-feedback",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Usage Examples

### Manual Trigger via API

```bash
# Trigger auto-feedback generation manually
curl -X POST "http://localhost:3000/api/auto-feedback-generator" \
  -H "Content-Type: application/json"
```

### Check Service Status

```bash
# Check if the service is running
curl "http://localhost:3000/api/cron/auto-feedback"
```

### Run Standalone Script

```bash
# Run the cron script manually
node scripts/auto-feedback-cron.js
```

## Configuration Options

### Feedback Generation Settings

You can modify these settings in `src/lib/auto-feedback-cron.ts`:

```typescript
// Number of feedbacks to generate when threshold is reached
const feedbacksToGenerate = 20;

// Threshold for triggering generation
if (currentCount < 5) {
  // Generate feedbacks
}

// Batch size for AI requests
const batchSize = 5;

// Delay between batches (milliseconds)
await this.delay(500);
```

### Language Support

Currently supported languages:
- English (`en`, `english`)
- Hindi (`hi`, `hindi`)
- Gujarati (`gu`, `gujarati`)

To add new languages, update the `languagePrompts` object in both:
- `src/lib/auto-feedback-cron.ts`
- `src/app/api/auto-feedback-generator/route.ts`

## Monitoring and Logging

### Log Output

The system provides detailed logging:

```
🤖 Starting auto-feedback generation process...
📊 Business Name (en): 3 feedbacks
🚀 Generating feedbacks for Business Name in English
✨ Generated 20 feedbacks for Business Name (en)
✅ Auto-feedback generation completed
```

### Success Response

```json
{
  "success": true,
  "processedBusinesses": 5,
  "totalFeedbacksGenerated": 100,
  "message": "Auto-feedback generation completed"
}
```

### Error Handling

The system includes comprehensive error handling:
- AI API failures fall back to templates
- Database errors are logged but don't stop processing
- Network timeouts are handled gracefully
- Concurrent execution prevention

## Performance Considerations

### Optimization Features

1. **Batch Processing**: Processes AI requests in batches of 5
2. **Delays**: Adds delays between batches to avoid API rate limits
3. **Singleton Pattern**: Prevents concurrent executions
4. **Database Indexing**: Optimized queries with proper indexes
5. **Timeout Handling**: 5-second timeout for AI requests in cron mode

### Resource Usage

- **Memory**: Minimal, processes businesses sequentially
- **CPU**: Low impact, mostly I/O operations
- **Network**: Controlled with batching and delays
- **Database**: Optimized with indexes and batch inserts

## Troubleshooting

### Common Issues

1. **No feedbacks generated**
   - Check if businesses have language preferences set
   - Verify `business_language_preferences` table has data
   - Check OpenRouter API key if using AI generation

2. **AI generation failing**
   - System automatically falls back to templates
   - Check OpenRouter API key and credits
   - Verify network connectivity

3. **Cron job not running**
   - Check cron service is active
   - Verify script permissions
   - Check environment variables are set

### Debug Commands

```bash
# Check business language preferences
SELECT b.name, blp.language_code, blp.language_name 
FROM businesses b 
JOIN business_language_preferences blp ON b.id = blp.business_id 
WHERE b.status = 'active';

# Check current feedback counts
SELECT b.name, bf.language_code, COUNT(*) as feedback_count
FROM businesses b 
JOIN business_feedbacks bf ON b.id = bf.business_id 
GROUP BY b.name, bf.language_code 
ORDER BY feedback_count;

# Test the API endpoint
curl -X GET "http://localhost:3000/api/cron/auto-feedback"
```

## Security Considerations

1. **API Authentication**: Use `CRON_SECRET_TOKEN` for production
2. **Rate Limiting**: Built-in delays prevent API abuse
3. **Input Validation**: All inputs are validated and sanitized
4. **Error Logging**: Sensitive data is not logged
5. **Database Security**: Uses parameterized queries

## Future Enhancements

Potential improvements for the system:

1. **Dynamic Thresholds**: Configure threshold per business
2. **Feedback Quality Scoring**: Rate generated feedback quality
3. **Advanced Language Detection**: Better language validation
4. **Analytics Dashboard**: Monitor generation statistics
5. **Custom Templates**: Business-specific template customization
6. **Feedback Scheduling**: Generate at optimal times
7. **A/B Testing**: Test different generation strategies

## Support

For issues or questions about the auto-feedback system:

1. Check the logs for error messages
2. Verify database schema is up to date
3. Test API endpoints manually
4. Check environment variables
5. Review cron job configuration

The system is designed to be robust and self-healing, with comprehensive fallback mechanisms to ensure reliable operation.