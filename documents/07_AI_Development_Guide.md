# AI-Assisted Development Guide

## 1. Цель

Разработать систему практически без расходов на модельный API, при этом не привязать архитектуру к одной бесплатной модели.

## 2. Принцип

AI помогает писать код, но не является источником истины. Каждое AI-generated изменение проходит:

1. формулировка требования;
2. план от разработчика;
3. генерация небольшого patch;
4. review пользователем;
5. запуск тестов;
6. ручная проверка;
7. запись решения в ADR/документацию.

## 3. Рекомендуемый бесплатный контур

### Локально

Ollama — основной runtime. Преимущество: inference не требует оплаты API и код проекта по умолчанию можно не отправлять внешнему провайдеру. Конкретные модели выбирать по локальному железу; каталог Ollama меняется. [1]

### Внешний fallback

OpenRouter free — использовать для коротких задач, сравнения моделей и случаев, когда локальная модель недостаточна. Free router автоматически выбирает доступную free-модель; список меняется со временем. Free plan на момент спецификации заявляет 50 requests/day. [2]

### Дополнительный эксперимент

Hugging Face Inference Providers. У бесплатного аккаунта есть небольшой ежемесячный кредит; размер может меняться, поэтому провайдер не должен быть единственной зависимостью. [3]

## 4. Роли моделей

Одна модель не обязана делать всё.

- Coding: code-oriented local/free model.
- Explanation grading: reasoning/general model.
- Task generation: general model.
- Classification: lightweight model.

## 5. AI workflow для разработки

### Шаг A — Specification First

Перед AI формулируется:

- проблема;
- входы;
- выходы;
- acceptance criteria;
- edge cases;
- ограничения.

### Шаг B — Architecture First

AI сначала просит предложить 2–3 варианта и trade-offs.

### Шаг C — Small Patch

Одна задача = один небольшой patch.

### Шаг D — Test

Тесты должны быть написаны до или одновременно с изменением.

### Шаг E — Explain-back

После принятия patch пользователь сам объясняет:

- что изменилось;
- почему так;
- почему другие варианты хуже;
- какой failure mode возможен.

## 6. Запреты

- не отдавать AI весь репозиторий без необходимости;
- не принимать большие opaque rewrites;
- не использовать AI output без тестов;
- не считать compile success признаком correctness;
- не отправлять секреты в prompts;
- не добавлять библиотеку только потому, что модель ее предложила.

## 7. Промпт-контракт для coding AI

Всегда просить:

- сначала анализ;
- затем план;
- затем patch;
- указать измененные файлы;
- указать риски;
- указать тесты;
- не изменять несвязанные файлы.

## 8. AI grading safety

AI grader не считается абсолютной истиной. Для критических assessment results должна существовать deterministic rubric + набор reference answers/test cases. AI может выставить preliminary score, после чего система применяет deterministic checks.

## Источники

[1] Ollama local models: https://ollama.com/search?c=local

[2] OpenRouter free models/router: https://openrouter.ai/collections/free-models ; https://openrouter.ai/openrouter/free

[3] Hugging Face pricing: https://huggingface.co/docs/inference-providers/en/pricing
