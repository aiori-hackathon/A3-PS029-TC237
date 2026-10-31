#!/bin/sh
# Active Probing and goDASH Client Measurement Runner (PS-029)
# Team DevElite - AIORI Hackathon 3

SERVER_HOST="${SERVER_HOST:-server}"
SERVER_PORT="${SERVER_PORT:-8080}"
IPERF_PORT="${IPERF_PORT:-5201}"

echo "[CLIENT] Starting network measurement probes against $SERVER_HOST..."

# 1. ICMP Ping Latency
echo "[CLIENT] Measuring RTT..."
ping -c 5 "$SERVER_HOST" > /tmp/ping.log 2>&1

# 2. iperf3 Throughput & Loss
echo "[CLIENT] Measuring Throughput via iperf3..."
iperf3 -c "$SERVER_HOST" -p "$IPERF_PORT" -t 3 -J > /tmp/iperf.json 2>&1

# 3. goDASH Adaptive Bitrate Streaming Execution
echo "[CLIENT] Executing goDASH adaptive streaming session..."
if command -v godash >/dev/null 2>&1; then
    godash -url "http://${SERVER_HOST}:${SERVER_PORT}/stream.mpd" -adaptation "conventional" -duration 10 > /tmp/godash.log 2>&1
else
    echo "[CLIENT] goDASH binary emulated; fetching DASH manifest via curl..."
    curl -s "http://${SERVER_HOST}:${SERVER_PORT}/stream.mpd" > /tmp/stream.mpd
fi

echo "[CLIENT] Probes complete."
