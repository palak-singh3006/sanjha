"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CommunityDashboard } from "@/components/crop-intelligence/community-dashboard";
import { CropPlanForm } from "@/components/crop-intelligence/crop-plan-form";
import { MyCropPlans } from "@/components/crop-intelligence/my-crop-plans";
import { YieldPredictionCard } from "@/components/crop-intelligence/yield-prediction-card";
import { type CropPlan } from "@/features/crop-intelligence/types";
import { Sparkles, Users, FilePlus2, ListFilter, BrainCircuit } from "lucide-react";

export default function CropIntelligencePage() {
  const [activeTab, setActiveTab] = useState<string>("community");
  const [editingPlan, setEditingPlan] = useState<CropPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  function handlePlanCreated() {
    setRefreshKey((k) => k + 1);
    setEditingPlan(null);
    setActiveTab("my-plans");
  }

  function handleEditPlan(plan: CropPlan) {
    setEditingPlan(plan);
    setActiveTab("register");
  }

  function handleCancelEdit() {
    setEditingPlan(null);
    setActiveTab("my-plans");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              SANJHA Agronomic Intelligence
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <Badge variant="forest" className="text-[10px] py-0 px-2">Decision Support</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
            Community Crop Intelligence
          </h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">
            Village-level acreage concentration, staggered harvest planning, and predictive yield modeling across Yadgir command clusters.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap w-full sm:w-auto h-auto p-1 gap-1 border border-[var(--border)] bg-[var(--card)] rounded-lg">
          <TabsTrigger value="community" className="gap-2 py-2 px-3 text-xs sm:text-sm rounded data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--forest)] data-[state=active]:font-semibold">
            <Users className="h-4 w-4" />
            <span>Village Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="my-plans" className="gap-2 py-2 px-3 text-xs sm:text-sm rounded data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--forest)] data-[state=active]:font-semibold">
            <ListFilter className="h-4 w-4" />
            <span>My Crop Plans</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="gap-2 py-2 px-3 text-xs sm:text-sm rounded data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--forest)] data-[state=active]:font-semibold">
            <FilePlus2 className="h-4 w-4" />
            <span>{editingPlan ? "Edit Plan" : "Register Crop"}</span>
          </TabsTrigger>
          <TabsTrigger value="ml-predict" className="gap-2 py-2 px-3 text-xs sm:text-sm rounded data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--forest)] data-[state=active]:font-semibold">
            <BrainCircuit className="h-4 w-4" />
            <span>ML Yield Estimator</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Community Dashboard */}
        <TabsContent value="community" className="space-y-6">
          <CommunityDashboard
            onGoToRegister={() => setActiveTab("register")}
            onGoToMyPlans={() => setActiveTab("my-plans")}
            refreshTrigger={refreshKey}
          />
        </TabsContent>

        {/* Tab 2: My Crop Plans */}
        <TabsContent value="my-plans" className="space-y-6">
          <MyCropPlans onEditPlan={handleEditPlan} refreshKey={refreshKey} />
        </TabsContent>

        {/* Tab 3: Register / Edit Plan Form */}
        <TabsContent value="register" className="space-y-6 max-w-3xl">
          <CropPlanForm
            onPlanCreated={handlePlanCreated}
            editingPlan={editingPlan}
            onCancelEdit={handleCancelEdit}
          />
        </TabsContent>

        {/* Tab 4: ML Yield Estimator */}
        <TabsContent value="ml-predict" className="space-y-6">
          <YieldPredictionCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
