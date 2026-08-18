# Telegram Bot UX Specification

## 1. Роль Telegram

Telegram является ежедневным интерфейсом дисциплины, а web dashboard — интерфейсом анализа.

## 2. Основные действия

`Сегодня` — получить дневную сессию.

`Повторение` — открыть due items.

`Задание` — выполнить главную практическую задачу.

`Объяснить` — пройти explanation task.

`Прогресс` — получить summary.

`Неделя` — weekly assessment.

`Проект` — пройти project checkpoint.

## 3. Утренний сценарий

1. Напоминание.
2. 5–10 recall items.
3. Одна основная задача.
4. Сохранение результата.
5. Список remaining actions.

## 4. Вечерний сценарий

1. Explanation task.
2. Самооценка сложности.
3. Выбор: самостоятельно / с AI / не завершено.
4. Короткий отчет.

## 5. Сообщение прогресса

Пример:

`DAY 42`

`Retention 84%`
`Independent coding 68%`
`Project understanding 73%`
`Interview readiness 41%`

`Middle Gate: NOT READY`

`Главный блокер: Debugging`

`Завтра: 1 debugging task + 6 recall items`

## 6. Напоминания

- ежедневное основное напоминание;
- reminder через 6–12 часов, если обязательная сессия не завершена;
- weekly assessment reminder;
- configurable quiet hours.

## 7. Anti-overload

Если пользователь пропустил несколько дней, бот не вываливает весь backlog. Он перераспределяет его через scheduler.

## 8. Web App

Telegram Web App показывает:

- skill heatmap;
- retention chart;
- learning streak;
- project readiness;
- Middle Gate;
- interview funnel.
