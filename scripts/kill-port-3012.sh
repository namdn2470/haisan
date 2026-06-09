#!/usr/bin/env bash

PORT=3012

echo "Checking port $PORT..."

PIDS=$(lsof -ti tcp:$PORT)

if [ -z "$PIDS" ]; then
  echo "Port $PORT is free."
  exit 0
fi

echo "Killing process using port $PORT: $PIDS"
kill -9 $PIDS 2>/dev/null || true

echo "Port $PORT released."
