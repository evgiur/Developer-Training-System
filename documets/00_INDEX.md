# Adaptive Developer Training System — Documentation Set

Дата: 2026-08-17
Версия: 0.1
Статус: Baseline specification

## Назначение

Система предназначена для ежедневной подготовки разработчика от текущего уровня до проверяемой готовности к собеседованиям на Middle Full-stack Developer. Система должна:

- обеспечивать ежедневную регулярность;
- использовать интервальное повторение и активное извлечение знаний;
- измерять не время обучения, а подтвержденную компетентность;
- контролировать теорию, практическое программирование, debugging, архитектуру и понимание собственного SaaS;
- измерять зависимость от AI;
- автоматически перестраивать следующий учебный цикл на основании ошибок и результатов контроля;
- связывать учебный прогресс с реальными собеседованиями и их обратной связью.

## Комплект документов

1. `01_PRD_Product_Requirements.md` — продуктовые требования.
2. `02_SRS_System_Requirements.md` — функциональные и нефункциональные требования.
3. `03_Learning_Engine_Spec.md` — движок обучения, интервальные повторения и адаптация.
4. `04_Assessment_Scoring_Spec.md` — измерение компетенций и Middle Gate.
5. `05_Telegram_Bot_UX.md` — сценарии ежедневного взаимодействия и команды.
6. `06_Technical_Architecture.md` — архитектура и модель данных.
7. `07_AI_Development_Guide.md` — разработка системы с бесплатными/локальными AI-моделями.
8. `08_Implementation_Roadmap.md` — порядок разработки от нуля до MVP и далее.
9. `09_SaaS_Understanding_Audit.md` — методика аудита текущего SaaS, созданного с помощью AI.

## Базовые технологические решения

- Web dashboard: Next.js + React + TypeScript.
- Backend: TypeScript/Node.js в едином приложении на первом этапе.
- Database: PostgreSQL.
- Telegram: Bot API.
- AI Gateway: единый интерфейс провайдеров; локальный Ollama как основной бесплатный путь, OpenRouter free как резервный/дополнительный путь.
- Deployment: Docker Compose для локальной разработки; простой VPS/cloud deployment для MVP.

## Текущее ограничение

Система не может гарантировать трудоустройство. Она должна гарантировать только процесс контроля: регулярность, объективизацию прогресса, выявление пробелов и readiness gates.

## Внешние источники

- OpenRouter free models: https://openrouter.ai/collections/free-models
- OpenRouter free router: https://openrouter.ai/openrouter/free
- OpenRouter pricing/free plan: https://openrouter.ai/pricing
- Ollama local models: https://ollama.com/search?c=local
- Hugging Face Inference Providers pricing: https://huggingface.co/docs/inference-providers/en/pricing
- Hugging Face Inference Providers: https://huggingface.co/docs/hub/en/models-inference
