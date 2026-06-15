"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faLocationDot,
  faChevronRight,
  faTriangleExclamation,
  faCheckCircle,
  faClock,
  faCircleXmark,
  faChartLine,
  faMapLocationDot,
  faFire,
  faRotate,
  faCircleInfo,
  faFilter,
  faMagnifyingGlass,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import UrbanEcoLogo from "../components/urbanEcoLogo";
import SearchBox from "../components/Homepage/Header/searchBox";
import NotificationIcon from "../components/Homepage/Header/notificationIcon";
import ViewReport from "../components/Homepage/viewReport";
import IndividualReportDetails from "../components/Homepage/individualReportDetails";
import ReportsOverview from "../components/Homepage/reportsOverview";
import "../components/Homepage/header.css";
import Logout from "../components/Homepage/Header/logout";
import DistrictAnalytics from "../components/Homepage/districtAnalytics";
import reportsJson from "../../reports.json";
import { fetchFirestoreReports, Report } from "../utils/reports";

// Dynamically import components that might use window
const LocationMap = dynamic(
  () => import("../components/Homepage/MapRedirect/locationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-base-200 animate-pulse rounded-lg"></div>
    ),
  }
);

const HeatMap = dynamic(
  () => import("../components/Homepage/MapRedirect/heatMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-base-200 animate-pulse rounded-lg"></div>
    ),
  }
);

const Dashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [liveReports, setLiveReports] = useState<Report[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
    fetchFirestoreReports().then(setLiveReports);
  }, []);

  const reports = [...liveReports, ...(reportsJson.reports as Report[])];
  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      selectedStatus === "all" || report.status === selectedStatus;
    const matchesSearch = report.location
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
            Pending
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Show loading state during server-side rendering
  if (!isMounted || isLoading) {
    return (
      <div className="bg-base-100 p-5">
        <div className="animate-pulse">
          <div className="h-16 bg-base-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-base-200 rounded-lg"></div>
              <div className="h-64 bg-base-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-base-200 rounded-lg"></div>
              <div className="h-48 bg-base-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="navbar bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100 homepageHeader rounded-none px-6">
        <UrbanEcoLogo />
        <SearchBox />
        <div className="flex items-center gap-3">
          <NotificationIcon />
          <Logout />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Real-time waste management monitoring & control
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/report"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <FontAwesomeIcon icon={faCamera} />
                Report Trash
              </Link>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                <FontAwesomeIcon icon={faRotate} />
                Refresh
              </button>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleInfo} />
                Help
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="text-emerald-600 text-xl"
                />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {reports.length}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              Total Reports
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-amber-600 text-xl"
                />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {pendingCount}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2 font-medium">Pending</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600 text-xl"
                />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {resolvedCount}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2 font-medium">Resolved</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-red-600 text-xl"
                />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {reports.length - pendingCount - resolvedCount}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              In Progress
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Reports List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reports Section Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    Recent Reports
                  </h2>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    {filteredReports.length} locations
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-emerald-600"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-1">
                  {["all", "Pending", "Resolved"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedStatus === status
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                    >
                      {status === "all"
                        ? "All"
                        : status === "Pending"
                          ? "Pending"
                          : "Resolved"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredReports.map((report, index) => (
                  <div
                    key={report.id}
                    className={`flex flex-row h-12 rounded-xl shadow-sm justify-between items-center px-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${index % 2 === 0
                        ? "bg-gray-50 hover:bg-emerald-50"
                        : "bg-white hover:bg-emerald-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${report.status === "Pending"
                            ? "bg-red-500"
                            : report.status === "Resolved"
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                      ></div>
                      <span className="font-medium text-sm text-gray-700">
                        {report.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(report.status)}
                      <IndividualReportDetails reportId={report.id} />
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="text-3xl mb-2"
                    />
                    <p className="text-sm">No reports found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Overview */}
            <ReportsOverview />
          </div>

          {/* Right Column - Maps & Analytics */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon
                  icon={faMapLocationDot}
                  className="text-emerald-600"
                />
                <h3 className="font-bold text-gray-800 text-sm">
                  Hotspot Areas
                </h3>
              </div>
              <Suspense
                fallback={
                  <div className="w-full h-48 bg-base-200 animate-pulse rounded-lg"></div>
                }
              >
                <LocationMap />
              </Suspense>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                <h3 className="font-bold text-gray-800 text-sm">
                  Waste Density Heatmap
                </h3>
              </div>
              <Suspense
                fallback={
                  <div className="w-full h-48 bg-base-200 animate-pulse rounded-lg"></div>
                }
              >
                <HeatMap />
              </Suspense>
            </div>

            <Suspense
              fallback={
                <div className="w-full h-12 bg-base-200 animate-pulse rounded-lg"></div>
              }
            >
              <DistrictAnalytics />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
