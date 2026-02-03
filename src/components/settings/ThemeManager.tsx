"use client";

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * ThemeManager
 * 负责监听 Store 变化并动态更新 CSS 变量和 Link 标签
 */
export default function ThemeManager() {
  const { themeColor, customFavicon, customTitle } = useSettingsStore();

  // 更新主题色 CSS 变量
  useEffect(() => {
    if (!themeColor) return;
    
    // 将 hex 转为 r g b 格式，以便在 rgba() 中使用
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` 
        : '59 130 246';
    };

    document.documentElement.style.setProperty('--primary-color', hexToRgb(themeColor));
  }, [themeColor]);

  // 更新 Favicon
  useEffect(() => {
    if (!customFavicon) return;

    const updateFavicon = (url: string) => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    };

    updateFavicon(customFavicon);
  }, [customFavicon]);

  // 更新网站标题
  useEffect(() => {
    if (customTitle) {
      document.title = customTitle;
    }
  }, [customTitle]);

  return null;
}
