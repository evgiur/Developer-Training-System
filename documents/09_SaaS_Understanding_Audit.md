# SaaS Understanding Audit

## 1. Назначение

Этот документ нужен для превращения AI-generated SaaS в проект, который пользователь способен защищать на собеседовании.

## 2. Области аудита

1. Repository structure.
2. Runtime architecture.
3. Request/data flow.
4. Authentication.
5. Authorization.
6. Database schema.
7. Server-side logic.
8. Client-side state.
9. Error handling.
10. Testing.
11. Deployment.
12. Observability.
13. Security.
14. Business rules.

## 3. Для каждой области нужны четыре evidence

### E1 — Explain

Устно/письменно объяснить.

### E2 — Locate

Указать файл, функцию или модуль, отвечающий за механизм.

### E3 — Reproduce

Повторить ключевой механизм в упрощенном отдельном месте без AI.

### E4 — Modify

Внести изменение в существующий SaaS без разрушения соседнего поведения.

## 4. Пример checkpoint: Authentication

Вопросы:

- где создается session;
- как защищается route;
- как определяется текущий user;
- как сервер проверяет право доступа;
- что происходит после logout;
- где хранятся credentials/secrets;
- что произойдет при истекшей session.

Проверка:

- объяснение >= 85%;
- code location correct;
- reproduction passed;
- modification passed.

## 5. Пример checkpoint: Database

Пользователь должен:

- объяснить основные таблицы;
- объяснить связи;
- написать SELECT/JOIN;
- объяснить индекс;
- внести безопасное schema change;
- объяснить transaction boundary.

## 6. Anti-hallucination rule

Если пользователь говорит «кажется, это делает библиотека», система помечает ответ как unverified и требует найти реальный код/документацию.

## 7. Final Project Gate

SaaS считается interview-defensible, если:

- Architecture >= 85%;
- Data model >= 85%;
- Auth/Security >= 85%;
- Backend flow >= 85%;
- Frontend flow >= 80%;
- Deployment >= 75%;
- пользователь может без AI реализовать минимум 3 типовые модификации.
