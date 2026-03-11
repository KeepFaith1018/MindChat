/**
 * 数据库种子脚本
 *
 * 用于初始化数据库，创建默认用户
 */
import { prisma } from './prismaClient'

async function main() {
  console.log('开始 seed...')

  // 1. 清理旧数据 (开发环境下，生产环境请注释掉)
  // await prisma.usageQuota.deleteMany()
  // await prisma.message.deleteMany()
  // await prisma.conversation.deleteMany()
  // await prisma.account.deleteMany()
  // await prisma.user.deleteMany()

  // 2. 创建默认用户 (邮箱: admin@example.com, 密码: admin123)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$exampleHash12345678901234567890123456789012' // 密码: admin123
    }
  })

  console.log('Seeding 完成!')
  console.log('\n测试账号信息:')
  console.log('   用户名: user')
  console.log('   密码: user123')
  console.log('\n请在生产环境中删除此账号或修改密码!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
