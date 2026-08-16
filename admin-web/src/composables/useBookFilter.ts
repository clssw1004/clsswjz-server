import { ref } from 'vue';
import { adminApi } from '../api/admin';

export interface BookOption {
  id: string;
  name: string;
  createdAt?: number;
}

/**
 * 账本筛选：加载账本列表（最新创建在前），默认选中最新账本。
 * 报表与账目模块共用；跨账本统计无意义，故始终要求选中一个账本。
 */
export function useBookFilter() {
  const books = ref<BookOption[]>([]);
  const bookId = ref('');

  async function loadBooks(): Promise<void> {
    books.value = await adminApi.statsBooks();
    if (!bookId.value && books.value.length) {
      bookId.value = books.value[0].id;
    }
  }

  return { books, bookId, loadBooks };
}
