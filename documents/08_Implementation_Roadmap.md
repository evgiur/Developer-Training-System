# Implementation Roadmap

## Phase 0 — Specification

Deliverables:

- требования из этого комплекта;
- skill taxonomy;
- initial rubric;
- initial project audit checklist;
- local development environment.

Done when: можно открыть задачу, измерить результат и сохранить evidence.

## Phase 1 — Foundation

Создать:

- Next.js app;
- PostgreSQL;
- Prisma/Drizzle или другой ORM;
- auth;
- domain modules;
- migrations;
- tests;
- Telegram bot skeleton.

Gate: пользователь создается, Telegram user связывается с account, DB работает.

## Phase 2 — Daily Loop

Создать:

- daily session;
- recall queue;
- task submission;
- result persistence;
- reminders.

Gate: система самостоятельно выдает новый день без ручного вмешательства.

## Phase 3 — Learning Engine

Создать:

- scheduler;
- interval model;
- error classification;
- remediation queue;
- weekly assessment.

Gate: ошибка меняет будущий учебный маршрут.

## Phase 4 — AI Gateway

Создать:

- provider abstraction;
- Ollama adapter;
- OpenRouter adapter;
- structured output;
- prompt versioning;
- AI usage logging.

Gate: provider можно переключить одной конфигурацией.

## Phase 5 — SaaS Audit

Создать:

- project registry;
- architecture checkpoints;
- code-point references;
- explanation tasks;
- reproduction tasks.

Gate: система способна показать, какие части проекта пользователь реально понимает.

## Phase 6 — Dashboard

Создать:

- skill heatmap;
- retention chart;
- progress trend;
- project map;
- Middle Gate.

## Phase 7 — Interview Loop

Создать:

- mock interviews;
- interview ledger;
- feedback taxonomy;
- remediation from real interview feedback.

## Phase 8 — Hardening

- backups;
- rate limits;
- error handling;
- observability;
- privacy review;
- security review;
- deployment documentation.

## Definition of Done для MVP

MVP принят, если пользователь может провести полный 7-дневный цикл:

`получить задание -> выполнить -> получить оценку -> ошибка попадает в remediation -> повторить -> пройти weekly assessment -> увидеть изменение readiness`.
