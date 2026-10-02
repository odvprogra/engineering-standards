FROM python:3.14-slim

RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY server.py .

USER 10001
EXPOSE 8000
CMD ["python", "server.py"]
