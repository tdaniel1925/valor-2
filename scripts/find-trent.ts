import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findTrent() {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    console.log('ALL USERS:');
    allUsers.forEach(u => {
      console.log(`  ${u.firstName} ${u.lastName} - ${u.email} - ${u.role} - ${u.status}`);
    });

    const trent = allUsers.find(u =>
      u.firstName?.includes('Trent') ||
      u.lastName?.includes('Daniel') ||
      u.email?.includes('trent')
    );

    if (trent) {
      console.log('\n✅ FOUND TRENT:');
      console.log(JSON.stringify(trent, null, 2));
    } else {
      console.log('\n❌ No user named Trent Daniel found');
      console.log('Checking commissions for user attribution...');

      const commWithUser = await prisma.commission.findFirst({
        select: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('Commission belongs to:');
      console.log(JSON.stringify(commWithUser?.user, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findTrent();
