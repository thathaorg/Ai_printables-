"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Palette,
  PenTool,
  Download,
  Star,
  Clock,
  Sparkles,
  Crown,
} from "lucide-react";
import Link from "next/link";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { startSessionTracking } from "@/lib/session-tracker";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useKindeBrowserClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, isLoading: isLoadingTranslations } = useTranslations();

  // ✅ Analytics State
  const [analytics, setAnalytics] = useState({
    coloringCount: 0,
    tracingCount: 0,
    totalHours: 0,
    recentActivities: [],
    plan: "FREE",
    remainingGenerations: 5,
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Start session tracking when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = startSessionTracking();
      return cleanup;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    
    if (isAuthenticated) {
      fetchAnalytics();
      
      // Refresh analytics every minute
      const interval = setInterval(fetchAnalytics, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{isLoadingTranslations ? "Loading..." : t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-xl shadow-lg border border-orange-100">
          <CardHeader className="text-center">
            <CardTitle className="text-orange-600">{isLoadingTranslations ? "Access Denied" : t('dashboard.accessDenied')}</CardTitle>
            <CardDescription>{isLoadingTranslations ? "Please log in to access the dashboard" : t('dashboard.pleaseLogin')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              asChild
              className="bg-orange-500 text-white hover:bg-orange-600 rounded-full w-full"
            >
              <a href="/api/auth/login">{isLoadingTranslations ? "Login" : t('auth.login')}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-orange-950 dark:via-zinc-900 dark:to-orange-900">
      {/* Mobile Header */}
      <MobileHeader onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPage="dashboard"
      />

      {/* Main Content */}
      <div className="pt-16 px-4 sm:px-6 md:px-8 lg:px-12 pb-8">
        <div className="max-w-3xl lg:max-w-5xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1">
              {isLoadingTranslations ? "Welcome back!" : t('dashboard.welcomeBack')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLoadingTranslations ? `Hi ${user?.given_name || "there"}` : `${t('dashboard.hi')} ${user?.given_name || t('dashboard.there')}`}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-3 text-center border-0 shadow-sm bg-white dark:bg-zinc-900 rounded-xl hover:shadow-md transition-all">
              <div className="text-lg sm:text-xl font-bold text-orange-600">
                {analytics.coloringCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {isLoadingTranslations ? "Coloring Pages" : t('dashboard.coloringPages')}
              </div>
            </Card>
            <Card className="p-3 text-center border-0 shadow-sm bg-white dark:bg-zinc-900 rounded-xl hover:shadow-md transition-all">
              <div className="text-lg sm:text-xl font-bold text-orange-500">
                {analytics.tracingCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {isLoadingTranslations ? "Traced Worksheets" : t('dashboard.tracedWorksheets')}
              </div>
            </Card>
            <Card className="p-3 text-center border-0 shadow-sm bg-white dark:bg-zinc-900 rounded-xl hover:shadow-md transition-all">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {analytics.totalHours.toFixed(1)}h
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {isLoadingTranslations ? "Active Time" : t('dashboard.activeTime')}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/create?mode=coloring">
              <Card className="p-4 text-center border-0 shadow-sm bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/30 hover:shadow-lg hover:scale-[1.02] transition-all rounded-xl">
                <Palette className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-orange-700">
                  {isLoadingTranslations ? "Coloring" : t('navigation.coloring')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLoadingTranslations ? "Create pages" : t('dashboard.createPages')}
                </div>
              </Card>
            </Link>
            <Link href="/create?mode=tracing">
              <Card className="p-4 text-center border-0 shadow-sm bg-gradient-to-br from-orange-200/50 to-orange-100 hover:shadow-lg hover:scale-[1.02] transition-all rounded-xl">
                <PenTool className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-orange-700">
                  {isLoadingTranslations ? "Tracing" : t('navigation.tracing')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLoadingTranslations ? "Practice writing" : t('dashboard.practiceWriting')}
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm bg-white/80 dark:bg-zinc-900 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                {isLoadingTranslations ? "Recent Activity" : t('dashboard.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-xs sm:text-sm">
              {analytics.recentActivities.length > 0 ? (
                analytics.recentActivities.map((activity: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "COLORING"
                          ? "bg-orange-500"
                          : activity.type === "TRACING"
                          ? "bg-orange-400"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <span className="text-muted-foreground truncate">
                      {activity.prompt}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs">
                  {isLoadingTranslations ? "No recent activity yet." : t('dashboard.noRecentActivity')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Membership Status */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-100 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-800/20 rounded-xl">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-orange-700">
                  {isLoadingTranslations ? (analytics.plan === "PREMIUM" ? "Premium Plan" : "Free Plan") : (analytics.plan === "PREMIUM" ? t('dashboard.premiumPlan') : t('dashboard.freePlan'))}
                </span>
              </div>
              {analytics.plan === "FREE" && (
                <p className="text-xs text-muted-foreground">
                  {isLoadingTranslations ? `${analytics.remainingGenerations} generations remaining today` : `${analytics.remainingGenerations} ${t('dashboard.generationsRemaining')}`}
                </p>
              )}
              <Link href="/create">
                <Button
                  size="sm"
                  className="w-full text-xs h-8 bg-orange-500 text-white hover:bg-orange-600 transition-all rounded-full flex items-center justify-center"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Create a Worksheet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card className="border-0 shadow-sm bg-white/80 dark:bg-zinc-900 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <User className="h-4 w-4" />
                {isLoadingTranslations ? "Profile" : t('navigation.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 truncate">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {isLoadingTranslations ? "Member since Dec 2024" : t('dashboard.memberSince')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/how-to-use">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 rounded-full flex items-center justify-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {isLoadingTranslations ? "Help" : t('navigation.help')}
              </Button>
            </Link>
            <LogoutLink>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 rounded-full flex items-center justify-center gap-1"
              >
                <Shield className="h-3 w-3" />
                {isLoadingTranslations ? "Logout" : t('auth.logout')}
              </Button>
            </LogoutLink>
          </div>
        </div>
      </div>
    </div>
  );
}
