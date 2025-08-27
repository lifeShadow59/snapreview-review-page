-- Check if data was inserted successfully
SELECT * FROM business_copy_metrics 
WHERE business_id = '5c0fa62d-63ad-4200-97de-db21ee4c0511';

-- Check business_metrics table
SELECT * FROM business_metrics 
WHERE business_id = '5c0fa62d-63ad-4200-97de-db21ee4c0511';

-- Check if trigger worked
SELECT 
    bcm.business_id,
    bcm.language_code,
    bcm.copy_count,
    bcm.last_copy_timestamp,
    bm.total_copy_count,
    bm.last_updated
FROM business_copy_metrics bcm
LEFT JOIN business_metrics bm ON bcm.business_id = bm.business_id
WHERE bcm.business_id = '5c0fa62d-63ad-4200-97de-db21ee4c0511';