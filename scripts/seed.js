const { PrismaClient } = require('@prisma/client');

async function seed() {
  const prisma = new PrismaClient();

  try {
    console.log('[SEED] Checking CodeMedic database initialization...');
    await prisma.$connect();

    // Check if demo repository already exists
    const existing = await prisma.repository.findFirst({
      where: { name: 'codemedic-demo-repository' },
    });

    if (existing) {
      console.log(`[SEED] Demo repository already exists in database (ID: ${existing.id}).`);
      process.exit(0);
    }

    console.log('[SEED] Seeding demo repository into database...');
    const repo = await prisma.repository.create({
      data: {
        name: 'codemedic-demo-repository',
        owner: 'codemedic',
        githubUrl: 'https://github.com/codemedic/codemedic-demo-repository',
        defaultBranch: 'main',
        language: 'TypeScript',
        framework: 'Node.js',
        packageManager: 'npm',
        localPath: 'codemedic-demo-repository',
      },
    });

    await prisma.activity.create({
      data: {
        repositoryId: repo.id,
        type: 'seed',
        message: 'Initial database seed populated default demo repository.',
      },
    });

    console.log(`[SEED] Database successfully seeded with demo repository: ${repo.id}`);
  } catch (error) {
    console.error('[SEED] Database seed error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
