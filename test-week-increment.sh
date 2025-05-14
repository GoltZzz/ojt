#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Testing Weekly Increment System ===${NC}"

# 1. Test direct week creation
echo -e "\n${GREEN}Test 1: Direct Week Creation${NC}"
echo "Running test-week-increment.js..."
node test-week-increment.js

# 2. Test cron job simulation
echo -e "\n${GREEN}Test 2: Cron Job Simulation${NC}"
echo "Running test-cron-trigger.js..."
node test-cron-trigger.js

echo -e "\n${YELLOW}=== Testing Completed ===${NC}"
echo "You can check your database to verify the weeks were created correctly."
echo "You may want to clean up any test weeks that were created." 