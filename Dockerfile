FROM node:22-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS frontend

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# The coverage reports only show what the tests reach, so failing tests or low coverage still build the image.
FROM frontend AS js-coverage
COPY coverage-index/istanbul.css /coverage-index/
RUN npx vitest run --coverage ; mkdir -p /coverage/js ; cat /coverage-index/istanbul.css >> /coverage/js/base.css

FROM python:3.12-slim@sha256:aa943ce411423c7582288f18707ff66eddcbaeb510502d747a72aeb34f30d159 AS python-coverage
WORKDIR /src
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
COPY --from=frontend /frontend/dist frontend/dist
RUN python -m coverage run -m pytest ; \
    python -m coverage html --fail-under=0 ; mkdir -p coverage/python ; \
    python -m coverage json --fail-under=0 -o coverage.json ; \
    python coverage-index/tools/functions.py coverage.json coverage/python/functions.json

FROM python:3.12-slim@sha256:aa943ce411423c7582288f18707ff66eddcbaeb510502d747a72aeb34f30d159

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0 \
    && useradd --create-home --uid 1000 portfolio

COPY app.py accounts.py data.py sso.py ./
COPY templates templates
COPY static static
COPY pages pages
COPY --from=frontend /frontend/dist frontend/dist
COPY coverage-index/index.html coverage/
COPY coverage-reports.json coverage/reports.json
COPY --from=python-coverage /src/coverage/python coverage/python
COPY --from=js-coverage /coverage/js coverage/js
RUN mkdir -p data && chown portfolio data

USER portfolio
EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "8", "app:app"]
