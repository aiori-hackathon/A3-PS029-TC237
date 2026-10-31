FROM python:3.11-slim
RUN apt-get update && apt-get install -y iproute2 iputils-ping iptables net-tools && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY gateway_server.py /app/gateway_server.py
EXPOSE 8000
CMD ["python3", "/app/gateway_server.py"]
