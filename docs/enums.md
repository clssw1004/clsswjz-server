# 枚举类型说明

## ItemType 记账类型
```typescript
enum ItemType {
  EXPENSE = 'EXPENSE',   // 支出
  INCOME = 'INCOME'      // 收入
}
```

## FundType 资金账户类型
```typescript
enum FundType {
  CASH = 'CASH',            // 现金
  DEBIT_CARD = 'DEBIT',     // 储蓄卡
  CREDIT_CARD = 'CREDIT',   // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  DEBT = 'DEBT',            // 欠款
  E_WALLET = 'E_WALLET',    // 网络钱包
  ALIPAY = 'ALIPAY',        // 支付宝
  WECHAT = 'WECHAT',        // 微信
  INVESTMENT = 'INVESTMENT',// 投资账户
  OTHER = 'OTHER'           // 其他
}
```

## Language 语言设置
```typescript
enum Language {
  ZH_CN = 'zh-CN',  // 简体中文
  ZH_TW = 'zh-TW',  // 繁体中文
  EN = 'en'         // 英语
}
```

## Currency 货币类型
```typescript
enum Currency {
  CNY = 'CNY',  // 人民币
  USD = 'USD',  // 美元
  EUR = 'EUR',  // 欧元
  GBP = 'GBP',  // 英镑
  JPY = 'JPY',  // 日元
  HKD = 'HKD'   // 港币
}
```
