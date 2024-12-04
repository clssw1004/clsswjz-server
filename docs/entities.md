# 数据结构说明

## AccountFund 资金账户
```typescript
{
  id: string;              // 主键ID
  name: string;        // 资金账户名称
  fundType: FundType;      // 资金类型
  fundRemark: string;      // 备注
  fundBalance: number;     // 余额
  isDefault: boolean;      // 是否默认账户
  createdBy: string;       // 创建人ID
  updatedBy: string;       // 更新人ID
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

// ... 其他实体的结构说明
