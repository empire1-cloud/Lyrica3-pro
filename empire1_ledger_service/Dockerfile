FROM python:3.11-slim
WORKDIR /app

# Copy ledger service + soulfire kernel library
COPY empire1_ledger_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY soulfire_kernel/ ./soulfire_kernel/
COPY empire1_ledger_service/ ./empire1_ledger_service/

# Ledger data persisted via Cloud Run volume mount in prod;
# local dir used in dev / smoke tests
RUN mkdir -p /data && ln -s /data /app/soulfire_kernel/empire1_ledger/data

ENV PORT=8080
CMD ["uvicorn", "empire1_ledger_service.main:app", "--host", "0.0.0.0", "--port", "8080"]
