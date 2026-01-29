'use client';

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MainCanvas from "@/components/layout/MainCanvas";
import DataSyncer from "@/components/layout/DataSyncer";
import ToastContainer from "@/components/ui/ToastContainer";

/**
 * Home Page
 * 应用主入口页面
 * 
 * 布局结构：
 * - DataSyncer: 负责数据同步（无 UI）
 * - ToastContainer: 全局消息提示容器
 * - Sidebar: 左侧导航栏
 * - Right Content Area:
 *   - Header: 顶部状态栏
 *   - MainCanvas: 主内容/小组件区域
 */
export default function Home() {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-slate-800">
      <DataSyncer />
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <MainCanvas />
      </div>
    </div>
  );
}
