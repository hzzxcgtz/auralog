import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始填充测试数据...\n");

  // ── 清理已有数据（避免重复 seed 报错） ──
  await prisma.taskPhoto.deleteMany();
  await prisma.dailyTask.deleteMany();
  await prisma.readingLog.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.globalTask.deleteMany();
  await prisma.book.deleteMany();
  await prisma.specialPeriod.deleteMany();
  await prisma.vacation.deleteMany();
  await prisma.reviewReport.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ 已清理旧数据");

  // ── 1. 创建家长账号 ──
  const parentHash = await bcrypt.hash("admin123", 10);
  const parent = await prisma.user.create({
    data: {
      role: "PARENT",
      username: "admin",
      name: "彤彤妈妈",
      passwordHash: parentHash,
    },
  });
  console.log(`  ✓ 家长账号：admin / admin123`);

  // ── 2. 创建学生账号 ──
  const studentHash = await bcrypt.hash("tong123", 10);
  const student = await prisma.user.create({
    data: {
      role: "STUDENT",
      username: "tong",
      name: "彤彤",
      passwordHash: studentHash,
      points: 185,
    },
  });
  console.log(`  ✓ 学生账号：tong / tong123（初始 185 流光币）`);

  // ── 2.5 创建默认任务类别 ──
  const defaultCategories = [
    { value: "SCHOOLWORK", label: "校内作业", color: "orange", sortOrder: 0 },
    { value: "PREVIEW", label: "新课预习", color: "caramel", sortOrder: 1 },
    { value: "EXERCISE", label: "教辅练习", color: "emerald", sortOrder: 2 },
    { value: "READING", label: "阅读", color: "teal", sortOrder: 3 },
  ];
  for (const c of defaultCategories) {
    await prisma.taskCategory.create({ data: c });
  }
  console.log(`  ✓ 任务类别：${defaultCategories.length} 个默认类别`);

  // ── 3. 创建假期 ──
  const now = new Date();
  const vacStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const vacEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const vacation = await prisma.vacation.create({
    data: {
      name: `${now.getFullYear()} 暑假`,
      startDate: vacStart,
      endDate: vacEnd,
    },
  });
  console.log(`  ✓ 假期：${vacation.name}`);

  // ── 3.5 创建特殊时间段 ──
  const specialPeriodsData = [
    {
      name: "家庭出游",
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 8),
      color: "orange",
      note: "去杭州玩 4 天，期间安排少量阅读任务",
    },
    {
      name: "外婆家小住",
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      endDate: new Date(now.getFullYear(), now.getMonth(), 13),
      color: "emerald",
      note: "去外婆家住几天，带作业去写",
    },
    {
      name: "返校日",
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 28),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 28),
      color: "purple",
      note: "返校报到",
    },
  ];
  for (const sp of specialPeriodsData) {
    await prisma.specialPeriod.create({
      data: {
        vacationId: vacation.id,
        name: sp.name,
        startDate: sp.startDate,
        endDate: sp.endDate,
        color: sp.color,
        note: sp.note,
      },
    });
  }
  console.log(`  ✓ 特殊时段：${specialPeriodsData.length} 项（家庭出游、外婆家小住、返校日）`);

  // ── 4. 创建书目 ──
  const booksData = [
    { title: "骆驼祥子", author: "老舍", isRequired: true, totalChapters: 24, totalPages: 256 },
    { title: "朝花夕拾", author: "鲁迅", isRequired: true, totalChapters: 10, totalPages: 152 },
    { title: "海底两万里", author: "儒勒·凡尔纳", isRequired: true, totalChapters: 47, totalPages: 412 },
    { title: "西游记", author: "吴承恩", isRequired: false, totalChapters: 100, totalPages: 1260 },
    { title: "小王子", author: "圣埃克苏佩里", isRequired: false, totalChapters: 27, totalPages: 112 },
    { title: "夏洛的网", author: "E·B·怀特", isRequired: false, totalChapters: 22, totalPages: 188 },
    { title: "草房子", author: "曹文轩", isRequired: false, totalChapters: 12, totalPages: 284 },
  ];
  for (const b of booksData) {
    await prisma.book.create({
      data: { ...b, studentId: student.id },
    });
  }
  console.log(`  ✓ 书目：${booksData.length} 本（必读 ${booksData.filter(b => b.isRequired).length} + 选读 ${booksData.filter(b => !b.isRequired).length}）`);

  // ── 5. 创建每日任务（过去 14 天 + 今天） ──
  const taskCategories = ["SCHOOLWORK", "PREVIEW", "READING", "EXERCISE"] as const;
  const taskTemplates = [
    { title: "完成数学暑假作业 P20-25", category: "SCHOOLWORK", time: 45 },
    { title: "语文阅读理解训练 2 篇", category: "SCHOOLWORK", time: 30 },
    { title: "英语单词背诵 Unit 5", category: "SCHOOLWORK", time: 20 },
    { title: "预习数学下册第 3 章", category: "PREVIEW", time: 30 },
    { title: "预习语文第 8 课", category: "PREVIEW", time: 25 },
    { title: "课外阅读《骆驼祥子》第 3 章", category: "READING", time: 30 },
    { title: "课外阅读《朝花夕拾》", category: "READING", time: 25 },
    { title: "五三数学练习 2 页", category: "EXERCISE", time: 40 },
    { title: "五三语文练习 1 页", category: "EXERCISE", time: 25 },
    { title: "英语阅读理解专项训练", category: "EXERCISE", time: 20 },
  ];

  const statusFlow = ["TODO", "TODO", "IN_PROGRESS", "DONE", "PENDING_REVIEW", "GRADED", "GRADED", "GRADED"];
  const statusWeights = { TODO: 0.2, IN_PROGRESS: 0.05, DONE: 0.05, PENDING_REVIEW: 0.1, GRADED: 0.6 };
  function pickStatus(dayOffset: number) {
    if (dayOffset < -2) return "GRADED";
    if (dayOffset === -1) {
      const r = Math.random();
      if (r < 0.5) return "GRADED";
      if (r < 0.7) return "PENDING_REVIEW";
      if (r < 0.85) return "DONE";
      return "TODO";
    }
    if (dayOffset === 0) {
      const r = Math.random();
      if (r < 0.3) return "GRADED";
      if (r < 0.5) return "PENDING_REVIEW";
      if (r < 0.65) return "IN_PROGRESS";
      if (r < 0.8) return "DONE";
      return "TODO";
    }
    return "TODO";
  }

  const studentNotes = [
    "今天的作业有点多，但我坚持做完了！",
    "这篇阅读理解很有意思，学到了不少新知识。",
    "英语单词今天背得特别快，用了新的记忆方法。",
    "数学题做得很顺利，感觉最近进步了。",
    "复习错题本发现之前有好几道题都做错了，现在懂了。",
    "预习了新课内容，感觉不太难，有信心学好。",
    "今天效率不错，提前完成了所有任务！",
    "有一道题想了很久才做出来，但很有成就感。",
  ];
  const parentComments = [
    "真棒！妈妈看到了你的努力，继续保持！",
    "完成得很好，注意休息，别太累哦。",
    "不用着急，一步一个脚印，妈妈相信你。",
    "专注的时间越来越长了，真不错。",
    "好记性不如烂笔头，用心了。💕",
    "这次比昨天进步了，继续加油！",
  ];

  let taskCount = 0;
  for (let dayOffset = -13; dayOffset <= 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    // 每天 2-4 个任务
    const tasksPerDay = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...taskTemplates].sort(() => Math.random() - 0.5);

    for (let i = 0; i < tasksPerDay; i++) {
      const template = shuffled[i % shuffled.length];
      const status = pickStatus(dayOffset);
      const spentTime = status !== "TODO"
        ? (template.time + Math.floor(Math.random() * 15)) * 60  // 秒
        : null;
      const points = status === "GRADED" ? Math.floor(Math.random() * 10) + 5 : null;

      await prisma.dailyTask.create({
        data: {
          vacationId: vacation.id,
          date,
          title: dayOffset >= 0 && i === 0
            ? template.title.replace("P20-25", "P26-30").replace("Unit 5", "Unit 6")
            : template.title,
          category: template.category,
          estimatedTime: template.time,
          status,
          spentTime,
          studentNote: (status === "PENDING_REVIEW" || status === "GRADED")
            ? studentNotes[Math.floor(Math.random() * studentNotes.length)]
            : null,
          parentComment: status === "GRADED"
            ? parentComments[Math.floor(Math.random() * parentComments.length)]
            : null,
          points,
          studentId: student.id,
        },
      });
      taskCount++;
    }
  }
  console.log(`  ✓ 任务：${taskCount} 条（含过去 2 周 + 今天 + 未来 7 天）`);

  // ── 6. 创建阅读记录 ──
  const books = await prisma.book.findMany();
  const excerptsList = [
    '"最可怕的不是死亡，而是在活着的时候死去。" 这句话让我思考了很久。',
    '"路是自己走出来的。" 祥子的坚持让我很感动。',
    '"不必说碧绿的菜畦，光滑的石井栏，高大的皂荚树..." 鲁迅笔下的百草园真美。',
    '"如果不去探索，就永远不知道海底的奥秘。" 尼摩船长很勇敢。',
    '"只有用心才能看清，本质的东西用眼睛是看不见的。" 小王子的话真深刻。',
    '"友谊就是一棵树，需要用心去浇灌。" 夏洛和威尔伯的友情令人感动。',
    '"油麻地小学的草房子，在夕阳下金灿灿的。" 桑桑的故事很温暖。',
    '"取经路上最难的不是妖怪，而是坚持。" 孙悟空越来越成熟了。',
    '"人生自古谁无死，留取丹心照汗青。" 文天祥的骨气让我敬佩。',
    '"读书破万卷，下笔如有神。" 要多读书才能写好作文。',
  ];
  const thoughtsList = [
    "今天读到了这一段，觉得写得特别好，作者用简单的语言表达了深刻的道理。",
    "这本书越读越有意思，情节越来越精彩了。",
    "读到感人处差点哭了，作者真是太会写了。",
    "这一段描写特别生动，画面感很强，好像就在眼前一样。",
    "今天又读完了一章，故事情节越来越吸引人了。",
    "感觉自己的阅读速度提高了不少，理解也更深入了。",
    "读到一些不理解的词语，查了字典，学到了新知识。",
    "书里的人物形象很鲜明，每个角色都有自己独特的性格。",
  ];

  let readingCount = 0;
  for (const book of books.slice(0, 5)) {
    const logCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < logCount; i++) {
      const logDate = new Date(now);
      logDate.setDate(logDate.getDate() - Math.floor(Math.random() * 14));

      const status = Math.random() > 0.3 ? "GRADED" : "PENDING_REVIEW";

      await prisma.readingLog.create({
        data: {
          bookId: book.id,
          studentId: student.id,
          date: logDate,
          progressRead: `第 ${Math.ceil((i + 1) * (book.totalChapters || 10) / logCount)} 章`,
          excerpts: excerptsList[Math.floor(Math.random() * excerptsList.length)],
          thoughts: thoughtsList[Math.floor(Math.random() * thoughtsList.length)],
          parentComment: status === "GRADED"
            ? parentComments[Math.floor(Math.random() * parentComments.length)]
            : null,
          points: status === "GRADED" ? Math.floor(Math.random() * 8) + 3 : null,
          status,
        },
      });
      readingCount++;
    }
  }
  console.log(`  ✓ 阅读记录：${readingCount} 条（含摘录和读后感）`);

  // ── 7. 创建奖品 ──
  const rewardsData = [
    { title: "买一本喜欢的课外书", cost: 80, stock: 3 },
    { title: "周末看一部电影（家长陪同）", cost: 50, stock: 5 },
    { title: "吃一次麦当劳", cost: 100, stock: 2 },
    { title: "买一个新文具盒", cost: 60, stock: 4 },
    { title: "游乐场半日游", cost: 200, stock: 1 },
    { title: "多玩 30 分钟平板", cost: 30, stock: 10 },
    { title: "买一盒乐高", cost: 150, stock: 2 },
    { title: "和同学去游泳馆", cost: 120, stock: 2 },
    { title: "奶茶一杯", cost: 20, stock: 10 },
    { title: "免做一次家务", cost: 40, stock: 5 },
  ];
  for (const r of rewardsData) {
    await prisma.reward.create({
      data: {
        title: r.title,
        cost: r.cost,
        stock: r.stock,
        status: "AVAILABLE",
      },
    });
  }
  console.log(`  ✓ 奖品：${rewardsData.length} 个已上架`);

  // ── 8. 创建兑换记录（2 个已批准 + 1 个待审核） ──
  const approvedRewards = await prisma.reward.findMany({ take: 2 });
  if (approvedRewards.length >= 2) {
    await prisma.reward.create({
      data: {
        title: "奶茶一杯",
        cost: 20,
        stock: 0,
        status: "APPROVED",
        userId: student.id,
        createdAt: new Date(now.getTime() - 7 * 86400000),
      },
    });
    await prisma.reward.create({
      data: {
        title: "多玩 30 分钟平板",
        cost: 30,
        stock: 0,
        status: "APPROVED",
        userId: student.id,
        createdAt: new Date(now.getTime() - 3 * 86400000),
      },
    });
    await prisma.reward.create({
      data: {
        title: "吃一次麦当劳",
        cost: 100,
        stock: 0,
        status: "PENDING",
        userId: student.id,
        createdAt: new Date(now.getTime() - 1 * 86400000),
      },
    });
  }
  console.log(`  ✓ 兑换记录：2 已批准 + 1 待审核`);

  // ── 9. 创建战报 ──
  const reportStart = new Date(now);
  reportStart.setDate(reportStart.getDate() - 14);
  const reportEnd = new Date(now);
  reportEnd.setDate(reportEnd.getDate() - 1);

  // 统计该时间段内的数据
  const periodTasks = await prisma.dailyTask.findMany({
    where: {
      studentId: student.id,
      date: { gte: reportStart, lte: reportEnd },
    },
  });
  const totalTasks = periodTasks.length;
  const completedTasks = periodTasks.filter(t =>
    t.status === "GRADED" || t.status === "PENDING_REVIEW"
  ).length;
  const totalFocusSec = periodTasks.reduce((s, t) => s + (t.spentTime || 0), 0);
  const totalPoints = periodTasks.reduce((s, t) => s + (t.points || 0), 0);

  const periodLogs = await prisma.readingLog.findMany({
    where: {
      studentId: student.id,
      date: { gte: reportStart, lte: reportEnd },
    },
  });
  const readingCountForReport = periodLogs.length;
  const excerptsCount = periodLogs.filter(l => l.excerpts).length;

  const reportSnapshot = {
    completedTasks,
    totalFocusHours: Math.round((totalFocusSec / 3600) * 10) / 10,
    totalPoints,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    readingCount: readingCountForReport,
    excerptsCount,
    booksRead: 3,
  };

  await prisma.reviewReport.create({
    data: {
      type: "STAGE",
      stageNumber: 1,
      startDate: reportStart,
      endDate: reportEnd,
      dataSnapshot: JSON.stringify(reportSnapshot),
      parentComment: "这一阶段表现很棒，每天坚持完成任务，还读了好几本书。阅读摘录写得越来越用心了，继续加油！妈妈为你骄傲。💕",
      badgeAwarded: "自律之星",
    },
  });
  console.log(`  ✓ 战报：第 1 阶段（含 14 天数据统计 + 自律之星徽章）`);

  // ── 10. 创建全局任务 ──
  const globalTasks = [
    { title: "暑假作业全部完成", targetCount: 1 },
    { title: "背诵古诗词 20 首", targetCount: 20, currentCount: 8 },
    { title: "英语单词 200 个", targetCount: 200, currentCount: 65 },
    { title: "课外阅读 5 本", targetCount: 5, currentCount: 2 },
  ];
  for (const gt of globalTasks) {
    await prisma.globalTask.create({
      data: {
        ...gt,
        currentCount: gt.currentCount ?? 0,
        studentId: student.id,
      },
    });
  }
  console.log(`  ✓ 全局任务：${globalTasks.length} 项`);

  // ── 总结 ──
  console.log("\n✅ 测试数据填充完毕！");
  console.log("\n📋 登录信息：");
  console.log("   家长：用户名 admin / 密码 admin123 → 管理后台");
  console.log("   学生：用户名 tong / 密码 tong123 → 学生主页");
  console.log("\n📊 数据概览：");
  console.log(`   任务 ${taskCount} 条 | 阅读 ${readingCount} 条`);
  console.log(`   书目 ${booksData.length} 本 | 奖品 ${rewardsData.length} 个`);
  console.log(`   特殊时段 ${specialPeriodsData.length} 项 | 学生余额 185 流光币`);
  console.log(`   1 个战报 | 2 个兑换已批准（奶茶+平板）+ 1 个待审核（麦当劳）`);
}

main()
  .catch((e) => {
    console.error("❌ Seed 失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
