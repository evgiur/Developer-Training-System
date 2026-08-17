# SRS — System Requirements Specification

## 1. Требования к функциям

| ID | Требование | Приоритет | Критерий приемки |
|---|---|---|---|
| FR-001 | Система создает дневную сессию | Must | Пользователь получает задания согласно текущему расписанию |
| FR-002 | Система хранит skill graph | Must | Любая компетенция имеет уровень, историю и evidence |
| FR-003 | Система формирует recall queue | Must | В сессии появляются элементы, у которых наступил due date |
| FR-004 | Система оценивает ответы | Must | Ответ получает score + error type + confidence |
| FR-005 | Система создает новую задачу после ошибки | Must | Неуспешная компетенция добавляется в remediation queue |
| FR-006 | Система проводит недельный контроль | Must | Создается assessment session с фиксированными условиями |
| FR-007 | Система контролирует AI usage | Must | Попытка маркируется как independent / assisted / AI-first |
| FR-008 | Система проверяет SaaS | Must | Есть project checkpoints и audit evidence |
| FR-009 | Система хранит интервью | Should | Можно записать вопросы, исход, слабые места |
| FR-010 | Система рассчитывает Middle Gate | Must | Каждое критическое измерение имеет порог |
| FR-011 | Система показывает динамику | Must | Доступны 7/30/90 day charts |
| FR-012 | Telegram и web используют общий backend | Must | Нет дублирующей бизнес-логики |

## 2. Нефункциональные требования

### NFR-001 Надежность

Сессия не должна теряться при повторной отправке Telegram update.

### NFR-002 Идемпотентность

Telegram webhook/update processing должен быть идемпотентным.

### NFR-003 Наблюдаемость

Логируются ошибки API, генерации AI, планирования, scoring и cron/scheduler.

### NFR-004 Безопасность

API keys, Telegram token и DB credentials не хранятся в репозитории.

### NFR-005 Model portability

Замена AI-провайдера не должна требовать изменения доменной логики.

### NFR-006 Explainability

Для каждого readiness score должна быть возможность увидеть contributing evidence.

### NFR-007 Reproducibility

Контрольные задания должны иметь версию. Изменение rubric не должно задним числом менять исторический результат.

## 3. Доменная модель

Основные сущности:

- User
- Skill
- SkillLevel
- Topic
- Question
- Task
- ReviewItem
- ReviewAttempt
- CodingAttempt
- ExplanationAttempt
- Assessment
- AssessmentAttempt
- Project
- ProjectCheckpoint
- Interview
- InterviewQuestion
- Evidence
- DailySession
- WeeklySession
- AIRequest
- AIUsage

## 4. Статусы

### Skill status

`unknown -> exposed -> recalled -> applied -> verified -> durable`

### Task status

`queued -> started -> submitted -> graded -> remediation`

### Project checkpoint

`not-audited -> partially-understood -> understood -> independently-reproduced -> verified`

## 5. API boundaries

- `/api/daily-session`
- `/api/reviews`
- `/api/tasks`
- `/api/assessments`
- `/api/project`
- `/api/interviews`
- `/api/progress`
- `/api/ai`

Названия могут быть изменены на этапе реализации; обязательна единая доменная модель.
