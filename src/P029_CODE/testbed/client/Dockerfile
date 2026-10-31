FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y iputils-ping iperf3 curl jq iproute2 python3 python3-pip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY run_probes.sh /app/run_probes.sh
RUN chmod +x /app/run_probes.sh
CMD ["tail", "-f", "/dev/null"]
