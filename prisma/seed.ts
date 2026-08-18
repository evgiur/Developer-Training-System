import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Skill Taxonomy & Initial Question Bank...');

  // 1. Initial Skills
  const skillsData = [
    { name: 'JavaScript/TypeScript', domain: 'JS/TS', weight: 12, description: 'Core JS engine, event loop, promises, TS type system, generics' },
    { name: 'React Architecture', domain: 'React', weight: 12, description: 'Hooks, re-renders, state management, refs, virtual DOM reconciliation' },
    { name: 'Next.js & Web Platform', domain: 'Next.js/Web', weight: 10, description: 'App router, RSC, SSR/SSG, caching, hydration, Web APIs' },
    { name: 'Backend & API Design', domain: 'Backend/API', weight: 12, description: 'REST, HTTP specs, middleware, validation, error handling, rate limiting' },
    { name: 'PostgreSQL & SQL', domain: 'SQL/DB', weight: 10, description: 'Relational design, indexing, JOINs, transactions, query optimization' },
    { name: 'Auth & Web Security', domain: 'Auth/Security', weight: 6, description: 'JWT, sessions, OAuth2, OWASP Top 10, CORS, CSP, password hashing' },
    { name: 'Architecture & System Design', domain: 'Architecture', weight: 12, description: 'Modular monolith, layering, caching strategies, event queues, scalability' },
    { name: 'Debugging & Troubleshooting', domain: 'Debugging', weight: 8, description: 'Log extraction, memory leaks, stacktrace analysis, reproduction' },
    { name: 'SaaS Project Audit', domain: 'Project Understanding', weight: 6, description: 'Deep structural understanding & defensibility of user SaaS' },
  ];

  for (const s of skillsData) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });

    console.log(`  ✓ Skill created/updated: ${skill.name}`);

    // Create a default Topic for each skill
    const topic = await prisma.topic.create({
      data: {
        skillId: skill.id,
        title: `${skill.name} Core Fundamentals`,
        description: `Essential concepts for ${skill.name}`,
      },
    });

    // Create a reference Question
    await prisma.question.create({
      data: {
        topicId: topic.id,
        title: `Explain fundamental principles of ${skill.name}`,
        content: `What are the key trade-offs and underlying mechanisms of ${skill.name}?`,
        difficulty: 2,
        referenceAnswer: `Core concept explanation for ${skill.name} emphasizing execution model and best practices.`,
      },
    });

    // Create a reference Task
    await prisma.task.create({
      data: {
        skillId: skill.id,
        title: `Implement practical feature in ${skill.name}`,
        description: `Write production-ready code demonstrating ${skill.name} patterns.`,
        type: 'CODING',
        difficulty: 3,
        initialCode: '// Write code here\n',
        solutionCode: '// Reference solution\n',
      },
    });
  }

  // Create default demo user
  const user = await prisma.user.upsert({
    where: { id: 'demo-user-1' },
    update: {},
    create: {
      id: 'demo-user-1',
      username: 'developer_pro',
      firstName: 'Junior/Middle',
      lastName: 'Developer',
    },
  });

  console.log(`  ✓ Demo user initialized: ${user.username}`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
