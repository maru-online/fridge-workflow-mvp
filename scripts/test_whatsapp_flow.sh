#!/bin/bash

# Configuration
URL="https://ymeixyzoontlhnwyztba.supabase.co/functions/v1/whatsapp"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZWl4eXpvb250bGhud3l6dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDQ2MTAsImV4cCI6MjA4NDUyMDYxMH0.3Y8p0t_rm2QQ216uOJ-tYfuQXkCSRkXD5JJ3UY38IeA"
PHONE_NUMBER="27835550001"
NAME="TestUser_$(date +%s)"

echo "Testing WhatsApp Flow with Phone: $PHONE_NUMBER and Name: $NAME"

# Helper function to send message
send_message() {
  local TEXT="$1"
  echo ">>> Sending: $TEXT"
  
  curl -s -X POST "$URL" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"object\": \"whatsapp_business_account\",
      \"entry\": [{
        \"id\": \"123456789\",
        \"changes\": [{
          \"value\": {
            \"messaging_product\": \"whatsapp\",
            \"metadata\": {
              \"display_phone_number\": \"1234567890\",
              \"phone_number_id\": \"1234567890\"
            },
            \"contacts\": [{
              \"profile\": {
                \"name\": \"$NAME\"
              },
              \"wa_id\": \"$PHONE_NUMBER\"
            }],
            \"messages\": [{
              \"from\": \"$PHONE_NUMBER\",
              \"id\": \"wamid.hbgkljhlkjhlkjh_$(date +%s)\",
              \"timestamp\": \"$(date +%s)\",
              \"text\": {
                \"body\": \"$TEXT\"
              },
              \"type\": \"text\"
            }]
          },
          \"field\": \"messages\"
        }]
      }]
    }"
  echo -e "\n-----------------------------------"
  sleep 2
}

# 1. Initial Greeting
send_message "Hello"

# 2. Consent
send_message "YES"

# 3. Start Sell Flow
send_message "SELL"

# 4. Provide Name
send_message "$NAME"

# 5. Provide Village
send_message "Soweto"

# 6. Provide Condition
send_message "GOOD"

# 7. Accept Offer
send_message "YES"

echo "Flow complete. Please check the Leads and Tickets tables."
