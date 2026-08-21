# Technical Architecture Specification

## 1. Архитектурный принцип

На MVP используется modular monolith. Микросервисы запрещены до появления реальной причины.

## 2. High-level architecture

Telegram Bot -> Application API -> PostgreSQL

Web Dashboard -> Application API -> PostgreSQL

Application API -> AI Gateway -> Ollama / OpenRouter / future providers

Scheduler -> Application API / jobs

## 3. Модули

- auth
- user
- skills
- learning
- scheduler
- assessments
- project-audit
- interviews
- ai-gateway
- notifications
- analytics

## 4. AI Gateway

Интерфейс:

`generateText(request)`
`generateStructured(request, schema)`
`gradeAnswer(answer, rubric)`
`evaluateExplanation(answer, rubric)`
`generateTask(skill, difficulty)`

Доменный код не знает конкретный model/provider.

## 5. AI providers

### Provider A — LM Studio local

Используется для максимальной независимости от внешнего API и нулевой стоимости inference. LM Studio предоставляет OpenAI-совместимый API (`/v1/chat/completions`) для локальных моделей. Текущая модель: `qwen/qwen3-coder-30b` на `http://127.0.0.1:1234`. Ранее использовался Ollama (до 2026-08-19), заменён на LM Studio для лучшей совместимости с OpenAI API-форматом.

### Provider B — OpenRouter free

Используется как внешний fallback. OpenRouter предоставляет отдельный free router и свободные варианты моделей; их каталог регулярно меняется. На текущем free plan заявлен лимит 50 запросов в день. Поэтому приложение должно иметь rate-limit и fallback. [1]

### Provider C — Hugging Face

Опциональный экспериментальный provider. Free users получают ограниченный ежемесячный кредит, размер которого может меняться. Это не следует считать гарантированно бесплатным production backend. [2]

## 6. Storage

PostgreSQL (production target). MVP phase uses SQLite (`file:./dev.db`) for zero-dependency local development. Migration to PostgreSQL is planned for production deployment — see `docker-compose.yml` for prepared configuration.

Минимальные индексы:

- review_items(user_id, due_at);
- attempts(user_id, created_at);
- skills(user_id, skill_id);
- tasks(status, priority);
- ai_requests(created_at);
- daily_sessions(user_id, session_date unique).

## 7. Scheduler

MVP: cron-triggered worker.

Необходимы:

- daily session generation;
- review due processing;
- reminder jobs;
- weekly assessment generation;
- aggregation jobs.

## 8. Security

- secrets in environment variables;
- Telegram webhook secret;
- authentication for dashboard;
- least privilege DB credentials;
- audit of AI requests;
- sensitive project code is not sent to external models by default.

## 9. Observability

Минимум:

- structured logs;
- request id;
- AI latency;
- AI provider errors;
- scheduled job failures;
- daily session success/failure;
- database errors.

## Источники по AI providers

[1] OpenRouter: https://openrouter.ai/pricing and https://openrouter.ai/openrouter/free

[2] Hugging Face: https://huggingface.co/docs/inference-providers/en/pricing
