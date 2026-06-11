#!/usr/bin/env bash
# Kill all SeaFool dev ports: 3001 (API), 3012 (web)
PORTS=(3001 3012)

for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Killing port $PORT (pids: $PIDS)"
    kill -9 $PIDS 2>/dev/null || true
  else
    echo "Port $PORT is free"
  fi
done

echo "Done."
