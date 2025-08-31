# Implementation Plan

- [ ] 1. Set up database schema and core data structures
  - Create feedback_analytics table with proper indexes for tracking copy interactions
  - Create database migration scripts for existing databases
  - Add database connection utilities for analytics operations
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 2. Implement language preferences API endpoint
  - Create GET /api/businesses/[id]/language-preferences endpoint
  - Write database query to fetch business language preferences
  - Implement error handling and fallback to English when no preferences exist
  - Write unit tests for language preferences retrieval
  - _Requirements: 3.1, 3.8_

- [ ] 3. Enhance live feedback generation API with language support
  - Update POST /api/businesses/[id]/generate-live-feedback to accept language_code parameter
  - Implement language code mapping to appropriate AI prompts
  - Add language validation and fallback mechanisms
  - Write unit tests for language-specific feedback generation
  - _Requirements: 3.3, 3.4, 3.7_

- [ ] 4. Create copy tracking API endpoint
  - Implement POST /api/businesses/[id]/track-copy endpoint
  - Write database operations to increment copy counters by language
  - Add timestamp recording for copy actions
  - Implement feedback cleanup functionality after successful copy
  - Write unit tests for copy tracking and cleanup operations
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [ ] 5. Implement analytics API for business dashboard integration
  - Create GET /api/businesses/[id]/analytics endpoint
  - Write aggregation queries for total copy counts and language breakdown
  - Implement business-specific data filtering and privacy controls
  - Add proper response formatting for dashboard consumption
  - Write unit tests for analytics data accuracy
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Update FeedbackGenerator component with dynamic language support
  - Add state management for available languages and selected language
  - Implement dynamic language button rendering based on database preferences
  - Add immediate feedback generation on language selection without requiring "Change Review" click
  - Integrate copy tracking API calls with existing copy button functionality
  - Write unit tests for component state management and user interactions
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [ ] 7. Implement comprehensive error handling and fallback mechanisms
  - Add frontend error handling for language loading failures with English fallback
  - Implement backend error handling for database connection issues
  - Add retry logic with exponential backoff for network timeouts
  - Create template-based fallbacks for AI service failures
  - Write unit tests for error scenarios and fallback behavior
  - _Requirements: 2.4, 3.8_

- [ ] 8. Add feedback lifecycle management and cleanup
  - Implement automatic feedback deletion after successful copy operations
  - Add error logging for failed cleanup operations without interrupting user experience
  - Ensure analytics data preservation during feedback cleanup
  - Write integration tests for complete feedback lifecycle
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9. Create comprehensive integration tests for end-to-end functionality
  - Write integration tests for complete user flow: load page → select language → generate feedback → copy review
  - Test analytics tracking accuracy throughout the entire flow
  - Verify Google Reviews redirect functionality remains intact
  - Test concurrent copy tracking updates and data consistency
  - _Requirements: 1.4, 1.5, 3.6, 4.4_

- [ ] 10. Implement performance optimizations and caching
  - Add caching for language preferences to reduce database queries
  - Optimize analytics queries with proper database indexing
  - Implement async operations for non-critical tracking functionality
  - Add database connection pooling for analytics operations
  - Write performance tests to ensure sub-2 second feedback generation time
  - _Requirements: 3.1, 4.2_