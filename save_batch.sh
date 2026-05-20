#!/bin/bash
# save_batch.sh — append ChatGPT JSON output to batch backup file
#
# Usage:
#   ./save_batch.sh 02
#
# Workflow per batch:
#   1. Copy the JSON output from your ChatGPT tab (Cmd+C)
#   2. Switch to terminal
#   3. Run: ./save_batch.sh <batch_number>
#   4. Switch to Claude and paste (clipboard is preserved)

FILE="batch_outputs_raw.txt"

if [ -z "$1" ]; then
  echo "Usage: ./save_batch.sh <batch_number>"
  echo "Example: ./save_batch.sh 02"
  exit 1
fi

BATCH_NUM="$1"
CLIPBOARD_SIZE=$(pbpaste | wc -c | tr -d ' ')

# Safeguard: refuse to save if clipboard looks too small to be a real batch output
if [ "$CLIPBOARD_SIZE" -lt 1000 ]; then
  echo "WARNING: clipboard is only $CLIPBOARD_SIZE chars."
  echo "Real batch JSON outputs are 10,000-25,000+ chars."
  echo "Did you copy the JSON from ChatGPT first? Aborting save."
  exit 1
fi

# Append header + clipboard + blank line
{
  echo "=== BATCH $BATCH_NUM ==="
  pbpaste
  echo ""
  echo ""
} >> "$FILE"

NEW_SIZE=$(wc -c < "$FILE" | tr -d ' ')
echo "Saved batch $BATCH_NUM ($CLIPBOARD_SIZE chars). File total: $NEW_SIZE chars."
echo "Clipboard preserved — you can paste into Claude now."
