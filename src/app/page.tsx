"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { TabId } from "@/lib/constants";
import OpsTab from "@/components/tabs/OpsTab";
import ActivityLogTab from "@/components/tabs/ActivityLogTab";
import NotesTab from "@/components/tabs/NotesTab";
import WorksTab from "@/components/tabs/WorksTab";
import KanbanTab from "@/components/tabs/KanbanTab";
import ResultTab from "@/components/tabs/ResultTab";

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  ops: OpsTab,
  activity: ActivityLogTab,
  notes: NotesTab,
  works: WorksTab,
  kanban: KanbanTab,
  results: ResultTab,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("ops");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={activeTab} onSelect={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-6">
        <TabContent />
      </main>
    </div>
  );
}
