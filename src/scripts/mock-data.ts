import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
let token = '';

// 生成随机日期
function randomDate(start: Date, end: Date) {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );

  // 格式化日期为 yyyy-MM-dd HH:mm:ss
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 生成随机金额
function randomAmount(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// 生成随机账目数据
function generateRandomItems(count: number) {
  const expenseCategories = [
    { name: '餐饮', type: 'EXPENSE' },
    { name: '交通', type: 'EXPENSE' },
    { name: '购物', type: 'EXPENSE' },
    { name: '娱乐', type: 'EXPENSE' },
    { name: '日用', type: 'EXPENSE' },
    { name: '服饰', type: 'EXPENSE' },
    { name: '医疗', type: 'EXPENSE' },
    { name: '教育', type: 'EXPENSE' },
  ];
  const incomeCategories = [
    { name: '工资', type: 'INCOME' },
    { name: '奖金', type: 'INCOME' },
    { name: '理财', type: 'INCOME' },
    { name: '兼职', type: 'INCOME' },
    { name: '报销', type: 'INCOME' },
  ];
  const shops = [
    '永辉超市',
    '盒马生鲜',
    '美团外卖',
    '肯德基',
    '星巴克',
    '711便利店',
    '沃尔玛',
    '优衣库',
    '地铁',
    '滴滴出行',
  ];
  const descriptions = {
    餐饮: ['午餐', '晚餐', '早餐', '下午茶', '夜宵', '买菜', '水果'],
    交通: ['地铁', '公交', '打车', '共享单车', '加油'],
    购物: ['日用品', '衣服', '电子产品', '化妆品', '零食'],
    娱乐: ['电影', 'KTV', '游戏', '健身', '旅游'],
    日用: ['洗漱用品', '清洁用品', '纸巾', '电费', '水费'],
    服饰: ['衣服', '鞋子', '包包', '配饰'],
    医疗: ['看病', '买药', '体检'],
    教育: ['书籍', '课程', '培训'],
    工资: ['月薪', '年终奖'],
    奖金: ['项目奖金', '季度奖金', '绩奖金'],
    理财: ['基金收益', '股票收益', '利息收入'],
    兼职: ['兼职收入', '私活收入'],
    报销: ['交通报销', '餐费报销', '办公用品报销'],
  };

  const items = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 12); // 生成最近12个月的数据

  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.2; // 80%概率是支出
    const type = isExpense ? 'EXPENSE' : 'INCOME';
    const categories = isExpense ? expenseCategories : incomeCategories;
    const category = categories[Math.floor(Math.random() * categories.length)];

    const amount = isExpense
      ? randomAmount(10, 500) // 支出金额范围
      : randomAmount(1000, 20000); // 收入金额范围

    const shop = isExpense
      ? shops[Math.floor(Math.random() * shops.length)]
      : null;
    const categoryDescriptions = descriptions[category.name] || [];
    const description =
      categoryDescriptions[
        Math.floor(Math.random() * categoryDescriptions.length)
      ];
    const accountDate = randomDate(startDate, endDate);

    items.push({
      amount,
      type,
      category: category.name,
      shop,
      description,
      accountDate,
    });
  }

  // 按日期降序排序
  return items.sort(
    (a, b) =>
      new Date(b.accountDate).getTime() - new Date(a.accountDate).getTime(),
  );
}

// 模拟数据
const mockData = {
  funds: [
    {
      name: '工资卡',
      fundType: 'DEBIT',
      fundBalance: 10000,
      fundRemark: '工资收入账户',
    },
    {
      name: '花呗',
      fundType: 'CREDIT',
      fundBalance: 0,
      fundRemark: '蚂蚁花呗',
    },
    {
      name: '微信钱包',
      fundType: 'E_WALLET',
      fundBalance: 2000,
      fundRemark: '微信支付',
    },
    {
      name: '支付宝',
      fundType: 'E_WALLET',
      fundBalance: 3000,
      fundRemark: '支付宝账户',
    },
  ],

  shops: [
    { name: '永辉超市' },
    { name: '盒马生鲜' },
    { name: '美团外卖' },
    { name: '肯德基' },
    { name: '星巴克' },
    { name: '711便利店' },
    { name: '沃尔玛' },
    { name: '优衣库' },
    { name: '地铁' },
    { name: '滴滴出行' },
  ],

  // 生成120条随机账目数据
  items: generateRandomItems(5000),
};

// API 调用函数
const api = {
  async login() {
    const { data } = await axios.post(`${API_URL}/auth/login`, {
      username: 'cuiwei',
      password: 'cuiwei',
    });
    token = data.data.access_token;
    console.log('token', data);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return data;
  },

  async createFund(fund: any) {
    const { data } = await axios.post(`${API_URL}/account/fund`, fund);
    return data;
  },

  async createShop(accountBookId: string, shop: any) {
    const { data } = await axios.post(`${API_URL}/account/shop`, {
      ...shop,
      accountBookId,
    });
    return data;
  },

  async createItems(accountBookId: string, fundId: string, items: any[]) {
    // 将items数组分成多个小批次，每批100条
    const batchSize = 500;
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    let totalSuccess = 0;
    const errors = [];

    // 逐批发送请求
    for (const batch of batches) {
      const itemsToCreate = batch.map((item) => ({
        ...item,
        accountBookId,
        fundId,
      }));

      try {
        const { data } = await axios.post(
          `${API_URL}/account/item/batch`,
          itemsToCreate,
        );
        totalSuccess += data.data.successCount;
        if (data.data.errors) {
          errors.push(...data.data.errors);
        }
        console.log(`成功创建 ${data.data.successCount} 条账目记录`);
      } catch (error) {
        console.error('批量创建账目失败:', error.response?.data || error);
        errors.push(error.message);
      }
    }

    return {
      successCount: totalSuccess,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  async linkFundToBook(accountBookId: string, fundId: string) {
    const { data } = await axios.patch(`${API_URL}/account/fund/${fundId}`, {
      fundBooks: [
        {
          accountBookId,
          fundIn: true,
          fundOut: true,
          isDefault: true,
        },
      ],
    });
    return data;
  },

  async createCategory(accountBookId: string, category: any, userId: string) {
    const { data } = await axios.post(`${API_URL}/account/category`, {
      name: category.name,
      accountBookId,
      categoryType: category.type,
    });
    return data;
  },

  async createItem(accountBookId: string, fundId: string, item: any) {
    const { data } = await axios.post(`${API_URL}/account/item`, {
      ...item,
      accountBookId,
      fundId,
    });
    return data;
  },
};

// 主函数
async function main() {
  try {
    console.log('开始初始化测试数据...');

    // 1. 登录
    console.log('登录...');
    await api.login();

    // 2. 获取默认账本
    console.log('获取账本信息...');
    const { data: books } = await axios.get(`${API_URL}/account/book`);
    const defaultBook = books.data[0];

    // 3. 创建资金账户
    console.log('创建资金账户...');
    const fundsResponse = await Promise.all(
      mockData.funds.map((fund) => api.createFund(fund)),
    );
    const defaultFund = fundsResponse[0].data;

    // 4. 关联资金账户到账本
    console.log('关联资金账户到账本...');
    await Promise.all(
      fundsResponse.map((fund) =>
        api.linkFundToBook(defaultBook.id, fund.data.id),
      ),
    );

    // 5. 创建商家
    console.log('创建商家...');
    await Promise.all(
      mockData.shops.map((shop) => api.createShop(defaultBook.id, shop)),
    );

    // 6. 创建账目
    console.log('创建账目...');
    const result = await api.createItems(
      defaultBook.id,
      defaultFund.id,
      mockData.items,
    );
    console.log(
      `账目创建完成！成功: ${result.successCount} 条${
        result.errors ? '，失败: ' + result.errors.length + ' 条' : ''
      }`,
    );
    if (result.errors) {
      console.log('错误信息:', result.errors);
    }

    console.log('数据初始化完成！');
  } catch (error) {
    console.error('初始化失败:', error.response?.data || error);
  }
}

// 运行脚本
main();
