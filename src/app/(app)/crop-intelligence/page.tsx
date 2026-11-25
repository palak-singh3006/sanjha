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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Community Crop Intelligence
            </h1>
            <Badge variant="gold" className="gap-1 py-1">
              <Sparkles className="h-3 w-3" />
              AI & ML Module
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-auto p-1.5 gap-1">
          <TabsTrigger value="community" className="gap-2 py-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span>Village Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="my-plans" className="gap-2 py-2 text-xs sm:text-sm">
            <ListFilter className="h-4 w-4" />
            <span>My Crop Plans</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="gap-2 py-2 text-xs sm:text-sm">
            <FilePlus2 className="h-4 w-4" />
            <span>{editingPlan ? "Edit Plan" : "Register Crop"}</span>
          </TabsTrigger>
          <TabsTrigger value="ml-predict" className="gap-2 py-2 text-xs sm:text-sm">
            <BrainCircuit className="h-4 w-4" />
            <span>ML Yield (Prototype)</span>
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
