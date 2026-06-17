FROM python:3.14-slim

RUN pip install poetry && poetry config virtualenvs.create false

WORKDIR /app

COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-interaction --no-root

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
