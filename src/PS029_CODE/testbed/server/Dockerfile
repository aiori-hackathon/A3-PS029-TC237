FROM python:3.11-slim
RUN apt-get update && apt-get install -y iperf3 iproute2 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY app_server.py /app/app_server.py
EXPOSE 8080 5201
CMD ["sh", "-c", "iperf3 -s -D && python3 /app/app_server.py"]
