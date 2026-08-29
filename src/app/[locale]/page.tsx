'use client';

import Sidebar from "@/components/layout/Sidebar";
import CanvasToolbar from "@/components/layout/CanvasToolbar";
import MainCanvas from "@/components/layout/MainCanvas";
import ToastContainer from "@/components/ui/ToastContainer";
import DragDropProvider from "@/components/layout/DragDropProvider";
import FirstRunGuide from '@/components/onboarding/FirstRunGuide';

/**
 * Home Page
 * 应用主入口页面
 * 
 * 布局结构：
 * - DataSyncer: 负责数据同步（无 UI）
 * - ToastContainer: 全局消息提示容器
 * - Sidebar: 左侧导航栏
 * - MainCanvas: 主内容/小组件区域
 * - CanvasToolbar: 低干扰的悬浮管理入口
 */
export default function Home() {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-slate-800">
      <ToastContainer />
      <FirstRunGuide />
      <DragDropProvider>
        <Sidebar />
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
          <MainCanvas />
          <CanvasToolbar />
        </div>
      </DragDropProvider>
    </div>
  );
}
