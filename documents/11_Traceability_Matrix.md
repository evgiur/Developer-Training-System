# Requirements Traceability Matrix

| Requirement | Module | Test/Evidence | MVP |
|---|---|---|---|
| FR-001 Daily session | learning/scheduler | E2E daily session test | Yes |
| FR-002 Skill graph | skills | DB + API tests | Yes |
| FR-003 Recall queue | scheduler/reviews | scheduler tests | Yes |
| FR-004 AI grading | ai-gateway/assessment | structured output + fixture tests | Yes |
| FR-005 Remediation | learning | unit + E2E | Yes |
| FR-006 Weekly assessment | assessment | E2E | Yes |
| FR-007 AI usage | attempts/ai | persistence tests | Yes |
| FR-008 SaaS audit | project-audit | checkpoint tests | Yes |
| FR-009 Interview ledger | interviews | API tests | Later |
| FR-010 Middle Gate | assessment | threshold fixtures | Yes |
| FR-011 Dashboard | analytics/web | visual + API tests | Yes |
| FR-012 shared backend | architecture | contract tests | Yes |
| NFR-002 idempotency | telegram/scheduler | duplicate update tests | Yes |
| NFR-004 secrets | infrastructure | secret scanning | Yes |
| NFR-005 model portability | ai-gateway | provider swap test | Yes |
| NFR-007 reproducibility | assessment | rubric version fixture | Yes |

## Release gate

Ни одно обязательное требование не считается завершенным без evidence, указанного в колонке Test/Evidence.
