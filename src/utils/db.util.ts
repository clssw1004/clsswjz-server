import { ColumnType } from 'typeorm';

export function getColumnTypeForDatabase(types: {
  sqlite: ColumnType;
  mysql?: ColumnType;
  postgres?: ColumnType;
}): ColumnType {
  const dbType = process.env.DB_TYPE || 'sqlite';
  return types[dbType as keyof typeof types] || types.sqlite;
}
