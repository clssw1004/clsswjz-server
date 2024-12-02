import { customAlphabet } from 'nanoid';

// 使用自定义字母表生成随机字符串
// 字母表包含小写字母和数字，避免使用容易混淆的字符（去掉了 l、o、0 等易混淆字符）
const alphabet = '123456789abcdefghijkmnpqrstuvwxyz';

/**
 * 生成指定长度的随机字符串
 * @param length 字符串长度，默认为 8
 * @returns 生成的随机字符串
 */
export const generateUid = (length: number = 8): string => {
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
};

/**
 * 生成主键ID
 * 生成32位的字符串，模拟UUID但不包含连字符
 * @returns 32位的随机字符串
 */
export const generatePrimaryKey = (): string => {
  const nanoid = customAlphabet(alphabet, 32);
  return nanoid();
};
