# Assessment & Scoring Specification

## 1. Шкала навыка

0 — не знаком.

1 — узнаю термин.

2 — могу пересказать после подсказки.

3 — могу объяснить самостоятельно.

4 — применяю в стандартной задаче.

5 — применяю в незнакомой задаче.

6 — могу отлаживать, сравнивать решения и объяснять trade-offs.

## 2. Компетентность

Каждая компетенция хранит:

- current_level;
- verified_level;
- confidence;
- last_verified_at;
- retention_status;
- evidence_count;
- recent_failures;
- AI_dependency.

## 3. Основные домены

- JavaScript/TypeScript
- React
- Next.js
- Browser/Web platform
- Backend/Node.js
- HTTP/API
- PostgreSQL/SQL
- Authentication/Security
- Git
- Testing
- Docker/Deployment
- Architecture/System Design
- Debugging
- SaaS project understanding
- Communication/Interview

## 4. Вес доменов для Middle readiness

Базовые стартовые веса:

| Домен | Вес |
|---|---:|
| JS/TS | 12 |
| React | 12 |
| Next.js/Web | 10 |
| Backend/API | 12 |
| SQL/DB | 10 |
| Auth/Security | 6 |
| Git/Testing | 6 |
| Deployment | 6 |
| Architecture | 12 |
| Debugging | 8 |
| Project Understanding | 6 |
|
Итого 100.

Веса должны быть конфигурируемыми.

## 5. Middle Gate v1

Кандидат считается `Interview-ready for Middle` только если одновременно:

- общий readiness >= 80%;
- JS/TS >= 80%;
- React >= 80%;
- Backend/API >= 75%;
- SQL/DB >= 75%;
- Architecture >= 75%;
- Debugging >= 75%;
- Project Understanding >= 85%;
- Explanation >= 85%;
- Independent Coding >= 80%;
- AI Independence >= 80%.

Порог может быть изменен после первых реальных интервью.

## 6. Evidence types

- multiple choice retrieval;
- free-text explanation;
- code submission;
- bug fix;
- architecture diagram/text;
- project code pointer;
- live modification;
- mock interview;
- real interview feedback.

## 7. Score integrity

Исторические оценки immutable. Если rubric изменился, создается новая версия rubric. Система должна хранить `rubric_version`.

## 8. Confidence

Confidence не должен быть равен self-rating. Это модельная оценка на основе evidence. Самооценка хранится отдельно и сравнивается с объективным результатом.

## 9. Разница между уровнем и готовностью

Высокая теория не компенсирует слабую практику. Middle Gate использует hard gates для критических доменов.
