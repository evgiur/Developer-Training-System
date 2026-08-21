# Developer Training System — техзадание для агента

**Репозиторий:** github.com/evgiur/Developer-Training-System
**Источник:** аудит кодовой базы от 2026-08-19, сверка `src/`, `prisma/schema.prisma`, `docker-compose.yml`, `.env.example` с документами в `documents/`.
**Формат:** каждая задача самодостаточна — можно выполнять по одной, в указанном порядке, либо параллельно там, где нет зависимостей.

Общий принцип: в схеме и спеках заложено больше, чем реализовано в application-слое. Задачи ниже — это преимущественно "дописать связывающий код", а не переделка модели данных.

---

## P0 — блокирует корректную работу конфигурации

### T1. Устранить рассинхронизацию provider'а базы данных

**Файлы:** `prisma/schema.prisma`, `.env.example`, `docker-compose.yml`, `src/app/page.tsx`

**Текущее состояние:**
- `prisma/schema.prisma` → `datasource db { provider = "sqlite" }`
- `.env.example` → `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dts_db?schema=public"`
- `docker-compose.yml` поднимает `postgres:16-alpine`
- `documents/00_INDEX.md` и `documents/06_Technical_Architecture.md` фиксируют PostgreSQL как решение
- `src/app/page.tsx` рисует в UI бейдж «DB: SQLite (dev.db)»

**Требуется:**
1. Принять решение: PostgreSQL (согласно документации) или SQLite (текущее фактическое состояние) как provider для этой фазы разработки.
2. Если PostgreSQL — изменить `provider` в `schema.prisma` на `"postgresql"`, прогнать `prisma migrate dev`, убрать бейдж «SQLite» из `page.tsx`.
3. Если SQLite — убрать `postgres`-сервис из `docker-compose.yml`, привести `.env.example` к `DATABASE_URL="file:./dev.db"`, задокументировать это отклонение от `06_Technical_Architecture.md` явно (или обновить сам документ).

**Приёмка:** `npx prisma validate` и `npx prisma migrate dev` проходят без ошибок с текущим `.env`; UI-бейдж соответствует реальному provider'у.

---

## P1 — критично для работоспособности заявленной ценности продукта

### T2. Связать `submitReviewAttempt()` с обновлением `SkillLevel`

**Файлы:** `src/modules/learning/daily-session.ts`, `src/app/api/skills/route.ts`, `prisma/schema.prisma`

**Текущее состояние:** ни один файл в `src/` не выполняет `prisma.skillLevel.update/create/upsert`. `submitReviewAttempt()` обновляет только `ReviewItem` и создаёт `ReviewAttempt`. В результате `GET /api/skills` (`src/app/api/skills/route.ts:19`) всегда получает `level = undefined` и использует дефолт:
```ts
const score = level ? Math.round((level.verifiedLevel / 6) * 100) : 70; // baseline 70%
```
Итог: `overallReadiness` не меняется от 70% независимо от реального прогресса пользователя.

**Требуется:**
1. В `submitReviewAttempt()` после обновления `ReviewItem` добавить `prisma.skillLevel.upsert(...)` для skill, связанного с данным `question`/`task` (через `question.topic.skillId` или `task.skillId`).
2. Определить и реализовать правило обновления `verifiedLevel`, `evidenceCount`, `confidence`, `retentionStatus`, `recentFailures`, `lastVerifiedAt` на основе `quality` и типа evidence — согласно `documents/04_Assessment_Scoring_Spec.md` §1–2 и §8 (`confidence` — модельная оценка, не self-rating).
3. Реализовать правило из `documents/03_Learning_Engine_Spec.md` §7: skill не считается `verified`, пока нет минимум одного независимого application evidence (не только теоретический вопрос); критичные skills требуют двух независимых подтверждений в разное время.
4. Обернуть весь набор мутаций в `submitReviewAttempt()` в `prisma.$transaction([...])` — сейчас три последовательных вызова (create attempt → update reviewItem → updateMany session) не атомарны; после добавления апдейта `SkillLevel` их станет четыре.

**Приёмка:** после серии `POST /api/daily-session` с разными `quality` для одного и того же skill, `GET /api/skills` отражает реальное изменение `score`, а не константные 70%.

### T3. Подключить `calculateCandidatePriority` к реальному отбору карточек

**Файлы:** `src/modules/learning/daily-session.ts`, `src/modules/learning/scheduler.ts`

**Текущее состояние:** `calculateCandidatePriority()` реализует формулу из `documents/03_Learning_Engine_Spec.md` §4 (`ForgettingRisk * Weakness * Importance * Staleness`), но импортируется в `daily-session.ts` и ни разу не вызывается. Реальный запрос:
```ts
prisma.reviewItem.findMany({
  where: { userId, dueAt: { lte: new Date() }, status: { in: ['QUEUED', 'REMEDIATION'] } },
  take: 10, // без orderBy
})
```

**Требуется:**
1. Для каждого кандидата вычислить `forgettingRisk`, `weakness`, `importance`, `stalenessDays` из связанных `SkillLevel` (появятся после T2) и `Skill.weight`.
2. Отсортировать кандидатов по `calculateCandidatePriority()` перед `take: 10` (в коде, не на уровне SQL — Prisma не умеет сортировать по вычисляемому полю напрямую).
3. Убедиться, что `isCriticalWeakness` вычисляется из `SkillLevel.retentionStatus === 'RISKY'` или аналогичного правила и реально влияет на порядок.

**Приёмка:** юнит-тест, показывающий, что при разных `SkillLevel` для двух skills карточки с более высоким priority-score оказываются в топе выборки `take: 10`.

### T4. Починить трекинг AI-зависимости

**Файлы:** `src/app/page.tsx`, `prisma/schema.prisma`, `src/app/api/daily-session/route.ts`

**Текущее состояние:**
- `handleSubmitQuality()` в `page.tsx` отправляет `POST /api/daily-session` без поля `isAiAssisted`, даже если пользователь только что прошёл `handleGradeWithAI()`.
- `ReviewAttempt.errorType` в `schema.prisma` документирован только пятью значениями: `KNOWLEDGE_GAP, MEMORY_LAPSE, APPLICATION_GAP, DEBUGGING_GAP, CARELESS_ERROR`. `documents/03_Learning_Engine_Spec.md` §6 требует семь, включая `AI_DEPENDENCY` и `COMMUNICATION_GAP`.

**Требуется:**
1. В `page.tsx` завести state-флаг (например, `usedAiGrading: boolean`), выставлять его в `true` внутри `handleGradeWithAI()`, передавать как `isAiAssisted` в теле `POST /api/daily-session` из `handleSubmitQuality()`.
2. Добавить `AI_DEPENDENCY` и `COMMUNICATION_GAP` в комментарий-перечисление `ReviewAttempt.errorType` (или, в рамках T7, вынести в нативный Prisma `enum`).
3. В логике T2 учитывать `isAiAssisted` при обновлении `SkillLevel.aiDependency` — например, скользящее среднее доли `isAiAssisted=true` попыток за последние N попыток по skill.

**Приёмка:** попытка, начавшаяся с `handleGradeWithAI()`, сохраняется в БД с `isAiAssisted: true`; `SkillLevel.aiDependency` реагирует на серию таких попыток.

### T5. Подключить Telegram-бота к системе

**Файлы:** `src/modules/telegram/bot.ts`, `src/scripts/start-bot.ts`

**Текущее состояние:** бот не импортирует Prisma. `/today` и `/progress` возвращают статичный хардкод. `/start` анонсирует `/review`, `/task`, `/explain` — обработчиков для них нет.

**Требуется:**
1. На `bot.command('start', ...)` реализовать поиск/создание `User` по `ctx.from.id` → `User.telegramId` (`prisma.user.upsert`).
2. Реализовать `/review`, `/task`, `/explain` как обработчики, вызывающие `getOrCreateTodaySession()` и фильтрующие `items` по типу (`question` → `/review`, `task.type === 'CODING'` → `/task`, `task.type === 'EXPLANATION'` → `/explain`).
3. Заменить хардкод в `/today` и `/progress` на реальные данные из `getOrCreateTodaySession()` и `/api/skills`-эквивалентной логики.
4. Добавить простой scheduled job (например, `node-cron` в `start-bot.ts` или отдельный процесс) для утренней рассылки — согласно `documents/06_Technical_Architecture.md` §7 ("cron-triggered worker... reminder jobs").

**Приёмка:** `/review`, `/task`, `/explain` отвечают реальными данными пользователя, отправленными через `telegramId`; настроен хотя бы один cron-job, инициирующий сообщение без действия пользователя.

---

## P2 — баги и надёжность

### T6. Race condition в `getOrCreateTodaySession`

**Файл:** `src/modules/learning/daily-session.ts`

Заменить паттерн `findUnique` → `create` на `prisma.dailySession.upsert({ where: { userId_sessionDate: {...} }, update: {}, create: {...} })`.

### T7. Баг в bootstrap-ветке `getOrCreateTodaySession`

**Файл:** `src/modules/learning/daily-session.ts`

После создания reviewItems из seed-данных повторный `findMany` выполняется как:
```ts
reviewItems = await prisma.reviewItem.findMany({ where: { userId }, include: {...} });
```
без фильтра по `status`/`dueAt` и без `take` — возвращает все reviewItems пользователя за всё время. Привести к тем же условиям, что и первый запрос (`dueAt: { lte: new Date() }, status: { in: [...] }, take: 10`).

### T8. Неверное поле эталона при AI-грейдинге кода

**Файл:** `src/app/page.tsx`, функция `handleGradeWithAI`

Строка:
```ts
const referenceAnswer = currentItem?.question?.referenceAnswer || currentItem?.task?.description || 'Standard answer';
```
Для `task` с `type === 'CODING'` эталоном должен быть `task.solutionCode`, а не `task.description` (это лишь текст задания). Исправить приоритет полей с учётом `task.type`.

### T9. `quality=2` не отличается от `quality=3`

**Файл:** `src/modules/learning/scheduler.ts`, функция `calculateNextInterval`

`documents/03_Learning_Engine_Spec.md` §3 требует: `2` → «повтор через короткий интервал», `3` → «интервал увеличивается». В коде обе ветки проходят идентичную логику внутри одного `else`-блока (различие есть только для `quality === 4`). Добавить отдельную ветку для `quality === 2`, дающую короткий фиксированный интервал независимо от `repetitions`. Если `quality=2` сознательно исключён из UI (см. `page.tsx`, кнопки только 0/1/3/4) — либо реализовать ветку для полноты API, либо явно задокументировать, что `quality=2` не используется, и убрать его из типов/спеки.

### T10. Дедупликация AI-адаптеров

**Файлы:** `src/modules/ai-gateway/ollama-adapter.ts`, `src/modules/ai-gateway/openrouter-adapter.ts`

`generateStructured()` (markdown-cleanup + `JSON.parse` + `schema.parse`) и весь промпт в `gradeAnswer()` продублированы 1:1 между двумя файлами. Вынести в `abstract class BaseAIAdapter implements IAIGatewayProvider`, оставив абстрактным только `generateText()`.

### T11. Устойчивость AI Gateway

**Файлы:** `src/modules/ai-gateway/ollama-adapter.ts`, `src/modules/ai-gateway/openrouter-adapter.ts`

1. Добавить `signal: AbortSignal.timeout(...)` в оба `fetch()` — сейчас зависший inference-процесс вешает запрос без ограничения по времени.
2. Обернуть `JSON.parse`/`schema.parse` в `generateStructured()` в try/catch с одной повторной попыткой (уточняющий промпт с текстом ошибки валидации) перед эскалацией на fallback-провайдер.
3. Реализовать запись в `prisma.aIRequest` (provider, model, promptType, latencyMs, status, errorMessage) на каждый вызов — модель в схеме для этого уже есть, но не используется нигде в `src/`.
4. Реализовать счётчик через `prisma.aIUsage` (userId, date, provider, requestCount) — `documents/06_Technical_Architecture.md` §5 фиксирует лимит OpenRouter free-tier в 50 запросов/день, сейчас ничего не отслеживает приближение к лимиту.

### T12. Weekly assessment не реализован

**Файлы:** новый route/модуль, `prisma/schema.prisma` (модель `WeeklySession` уже есть)

`WeeklySession` не имеет ни одного обращения в `src/`. Согласно `documents/03_Learning_Engine_Spec.md` §8 и `documents/08_Implementation_Roadmap.md` (Phase 3), нужен еженедельный контроль: 20 theoretical retrieval questions, 2 coding tasks, 1 debugging task, 1 project explanation, 1 architecture question, без AI-помощи при выполнении (AI может участвовать только в оценке).

### T13. Минимальная авторизация для dashboard/API

**Файлы:** `src/app/api/daily-session/route.ts`, `src/app/api/skills/route.ts`, `src/app/page.tsx`

Сейчас `userId` берётся из query-параметра/тела запроса без проверки (`page.tsx` отправляет `userId: 'demo-user-1'` как обычное JSON-поле). `documents/06_Technical_Architecture.md` §8 требует "authentication for dashboard". Минимальный вариант для single-user сценария — переиспользовать паттерн Auth.js v5 (уже применяется в ShiftMaster) для простой сессии/токена на dashboard; на API-уровне брать `userId` из сессии, а не из клиентского payload.

---

## P3 — гигиена кода и инфраструктура

### T14. Enum-подобные поля как нативные Prisma `enum`

**Файл:** `prisma/schema.prisma`

Перевести как минимум `ReviewItem.status`, `ReviewAttempt.errorType`, `DailySession.status`, `Task.type` из свободного `String` (значения только в комментариях) в `enum`.

### T15. Веса доменов не суммируются в 100

**Файл:** `prisma/seed.ts`

Текущая сумма весов девяти доменов: `12+12+10+12+10+6+12+8+6 = 88`. `documents/04_Assessment_Scoring_Spec.md` §4 фиксирует "Итого 100" для 11 доменов, включая отсутствующие в seed `Git/Testing` (6) и `Deployment` (6). Либо добавить эти два домена в seed, либо явно уменьшить итоговую сумму в спеке и задокументировать отклонение.

### T16. Рубрика грейдинга захардкожена

**Файл:** `src/app/api/ai/grade/route.ts`

`correctnessWeight/completenessWeight/depthWeight` заданы константами `0.4/0.3/0.3`. Читать из `Question.rubric` (JSON-строка, уже есть в схеме вместе с `rubricVersion` для версионирования согласно §7 "Score integrity").

### T17. Тестовое покрытие и DX-инфраструктура

- Добавить `vitest.config.ts` с резолвингом алиаса `@/*` (иначе тесты не смогут импортировать модули вроде `daily-session.ts`, использующие `@/lib/prisma`).
- Расширить `tests/scheduler.test.ts`: точные ожидаемые значения вместо `toBeGreaterThan`, тесты на ease factor floor (1.3), interval cap (180), `isCriticalWeakness` буст, явное разделение `quality=3` и `quality=4`.
- Добавить unit/integration тесты на `daily-session.ts` (после T6/T7 — race condition и bootstrap-баг) и на `ai-gateway/*` (fallback-путь, timeout, retry из T11).
- Добавить ESLint-конфиг (`package.json` уже содержит `"lint": "next lint"`, конфига нет).
- Добавить CI (GitHub Actions): lint + test + `prisma validate` + build на каждый push.
- Добавить `README.md` в корень репозитория (сейчас единственная точка входа — `documents/00_INDEX.md`, которую не видно на главной странице GitHub).

---

## Порядок выполнения

T1 → T2 → T3 → T4 → T6/T7 (можно параллельно с T2–T4) → T5 → T8/T9/T10/T11 → T12/T13 → T14–T17.

Каждую задачу закрывать отдельным коммитом/PR с ссылкой на соответствующий пункт этого документа для трассируемости (согласуется с `documents/11_Traceability_Matrix.md`).
