import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 响应式断点监听：isMobile 为 true 时渲染移动端卡片布局。
 * 与 CSS media query 同一断点（767px），用于切换组件 props（如分页布局）。
 */
export function useIsMobile(query = '(max-width: 767px)') {
  const isMobile = ref(false);
  let mq: MediaQueryList | null = null;

  const onChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches;
  };

  onMounted(() => {
    mq = window.matchMedia(query);
    isMobile.value = mq.matches;
    mq.addEventListener('change', onChange);
  });

  onBeforeUnmount(() => {
    mq?.removeEventListener('change', onChange);
  });

  return isMobile;
}
