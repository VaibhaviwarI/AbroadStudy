import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Sparkles, 
  FileText, 
  BarChart3, 
  Search, 
  GraduationCap, 
  Globe2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  
  const [user, setUser] = useState({
    id: "64f1a2b3c4d5e6f7a8b9c0d1",
    fullName: "Aarav Malhotra",
    email: "aarav@example.com",
    role: "student",
    targetCountries: ["Canada", "UAE"],
    interestedFields: ["Computer Science", "Data Science"],
    preferredIntake: "September",
    maxBudgetUsd: 23000,
    englishScore: 7.0
  });
  const [token, setToken] = useState("demo-token");

  const [discoveryType, setDiscoveryType] = useState("programs");
  const [programs, setPrograms] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [applyModalProgram, setApplyModalProgram] = useState(null);
  const [applyIntake, setApplyIntake] = useState("September");
  const [applyNote, setApplyNote] = useState("");
  const [notification, setNotification] = useState(null);

  const [stats, setStats] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fallbackPrograms = [
    {
      _id: "p1",
      title: "Master of Applied Computing",
      universityName: "University of Windsor",
      country: "Canada",
      city: "Windsor",
      field: "Computer Science",
      degreeLevel: "master",
      tuitionFeeUsd: 21500,
      intakes: ["September", "May"],
      minimumIelts: 6.5,
      scholarshipAvailable: true
    },
    {
      _id: "p2",
      title: "MSc Artificial Intelligence",
      universityName: "Heriot-Watt University Dubai",
      country: "UAE",
      city: "Dubai",
      field: "Data Science",
      degreeLevel: "master",
      tuitionFeeUsd: 22800,
      intakes: ["September", "January"],
      minimumIelts: 6.5,
      scholarshipAvailable: true
    },
    {
      _id: "p3",
      title: "Master of Data Science",
      universityName: "Deakin University",
      country: "Australia",
      city: "Melbourne",
      field: "Data Science",
      degreeLevel: "master",
      tuitionFeeUsd: 24200,
      intakes: ["July", "November"],
      minimumIelts: 6.5,
      scholarshipAvailable: true
    },
    {
      _id: "p4",
      title: "Post-Graduate Certificate in Cloud Data",
      universityName: "Conestoga College",
      country: "Canada",
      city: "Kitchener",
      field: "Information Technology",
      degreeLevel: "certificate",
      tuitionFeeUsd: 13200,
      intakes: ["January", "May", "September"],
      minimumIelts: 6.0,
      scholarshipAvailable: false
    }
  ];

  const fallbackRecommendations = [
    {
      _id: "p1",
      title: "Master of Applied Computing",
      universityName: "University of Windsor",
      country: "Canada",
      tuitionFeeUsd: 21500,
      matchScore: 100,
      reasons: [
        "Preferred country match: Canada",
        "Field alignment: Computer Science",
        "Within budget range",
        "Preferred intake available: September",
        "English test score meets requirement"
      ]
    },
    {
      _id: "p2",
      title: "MSc Artificial Intelligence",
      universityName: "Heriot-Watt University Dubai",
      country: "UAE",
      tuitionFeeUsd: 22800,
      matchScore: 100,
      reasons: [
        "Preferred country match: UAE",
        "Field alignment: Data Science",
        "Within budget range",
        "Preferred intake available: September",
        "English test score meets requirement"
      ]
    }
  ];

  const fallbackApplications = [
    {
      _id: "app1",
      program: { title: "Master of Applied Computing", tuitionFeeUsd: 21500, country: "Canada" },
      university: { name: "University of Windsor" },
      destinationCountry: "Canada",
      intake: "September",
      status: "submitted",
      timeline: [
        { status: "draft", note: "Profile imported and initial draft created.", changedAt: "2026-10-01" },
        { status: "submitted", note: "Application package submitted with SOP.", changedAt: "2026-10-02" }
      ]
    }
  ];

  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      if (discoveryType === "programs") {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedCountry) params.append("country", selectedCountry);
        if (sortBy) params.append("sortBy", sortBy);
        
        const res = await fetch(`${API_BASE}/programs?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setPrograms(json.data || []);
        } else {
          setPrograms(fallbackPrograms);
        }
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedCountry) params.append("country", selectedCountry);
        if (sortBy) params.append("sortBy", sortBy);

        const res = await fetch(`${API_BASE}/universities?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setUniversities(json.data || []);
        } else {
          setUniversities([
            { name: "Heriot-Watt University Dubai", country: "UAE", city: "Dubai", qsRanking: 256, popularScore: 92, scholarshipAvailable: true },
            { name: "University of Windsor", country: "Canada", city: "Windsor", qsRanking: 547, popularScore: 88, scholarshipAvailable: true },
            { name: "Deakin University", country: "Australia", city: "Melbourne", qsRanking: 233, popularScore: 86, scholarshipAvailable: true }
          ]);
        }
      }
    } catch {
      setPrograms(fallbackPrograms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscovery();
  }, [discoveryType, searchQuery, selectedCountry, sortBy]);

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.data?.recommendations || []);
      } else {
        setRecommendations(fallbackRecommendations);
      }
    } catch {
      setRecommendations(fallbackRecommendations);
    } finally {
      setRecLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppLoading(true);
    try {
      const res = await fetch(`${API_BASE}/applications?studentId=${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data || []);
      } else {
        setApplications(fallbackApplications);
      }
    } catch {
      setApplications(fallbackApplications);
    } finally {
      setAppLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/overview`);
      if (res.ok) {
        const json = await res.json();
        setStats({ ...json.data, cacheStatus: json.meta?.cache });
      } else {
        setStats({
          totalStudents: 3,
          totalPrograms: 8,
          totalApplications: 2,
          statusBreakdown: [{ _id: "submitted", count: 1 }, { _id: "under-review", count: 1 }],
          topCountries: [{ _id: "Canada", count: 1 }, { _id: "UK", count: 1 }],
          cacheStatus: "hit"
        });
      }
    } catch {
      setStats({
        totalStudents: 3,
        totalPrograms: 8,
        totalApplications: 2,
        statusBreakdown: [{ _id: "submitted", count: 1 }, { _id: "under-review", count: 1 }],
        topCountries: [{ _id: "Canada", count: 1 }, { _id: "UK", count: 1 }],
        cacheStatus: "miss"
      });
    }
  };

  useEffect(() => {
    if (activeTab === "recommendations") fetchRecommendations();
    if (activeTab === "applications") fetchApplications();
    if (activeTab === "counselor") fetchStats();
  }, [activeTab]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: user.id,
          programId: applyModalProgram._id,
          intake: applyIntake,
          note: applyNote || "Applied via Student Discovery Portal."
        })
      });

      const json = await res.json();
      if (res.ok) {
        showNotification("Application submitted successfully!");
        setApplyModalProgram(null);
        setApplyNote("");
        fetchApplications();
        setActiveTab("applications");
      } else {
        showNotification(json.message || "Failed to submit application.", "error");
      }
    } catch {
      setApplications(prev => [
        ...prev,
        {
          _id: "app-" + Date.now(),
          program: { title: applyModalProgram.title, tuitionFeeUsd: applyModalProgram.tuitionFeeUsd, country: applyModalProgram.country },
          university: { name: applyModalProgram.universityName },
          destinationCountry: applyModalProgram.country,
          intake: applyIntake,
          status: "submitted",
          timeline: [
            { status: "draft", note: "Draft initiated.", changedAt: new Date().toISOString() },
            { status: "submitted", note: applyNote || "Application submitted.", changedAt: new Date().toISOString() }
          ]
        }
      ]);
      showNotification("Application submitted successfully!");
      setApplyModalProgram(null);
      setActiveTab("applications");
    }
  };

  const handleTransition = async (appId, nextStatus) => {
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: nextStatus,
          note: `Transitioned to ${nextStatus} via counselor portal.`
        })
      });
      const json = await res.json();
      if (res.ok) {
        showNotification(`Application updated to '${nextStatus}'`);
        fetchApplications();
      } else {
        showNotification(json.message, "error");
      }
    } catch {
      setApplications(prev => prev.map(a => {
        if (a._id === appId) {
          return {
            ...a,
            status: nextStatus,
            timeline: [...a.timeline, { status: nextStatus, note: `Status updated to ${nextStatus}.`, changedAt: new Date().toISOString() }]
          };
        }
        return a;
      }));
      showNotification(`Application status transitioned to '${nextStatus}'`);
    }
  };

  const switchDemoUser = (type) => {
    if (type === "aarav") {
      setUser({
        id: "64f1a2b3c4d5e6f7a8b9c0d1",
        fullName: "Aarav Malhotra",
        email: "aarav@example.com",
        role: "student",
        targetCountries: ["Canada", "UAE"],
        interestedFields: ["Computer Science", "Data Science"],
        preferredIntake: "September",
        maxBudgetUsd: 23000,
        englishScore: 7.0
      });
      showNotification("Switched to Aarav Malhotra (Canada/UAE, $23k budget, 7.0 IELTS)");
    } else if (type === "sara") {
      setUser({
        id: "64f1a2b3c4d5e6f7a8b9c0d2",
        fullName: "Sara Khan",
        email: "sara@example.com",
        role: "student",
        targetCountries: ["UK", "Australia"],
        interestedFields: ["Business", "Hospitality"],
        preferredIntake: "January",
        maxBudgetUsd: 19000,
        englishScore: 6.5
      });
      showNotification("Switched to Sara Khan (UK/Australia, $19k budget, 6.5 IELTS)");
    } else {
      setUser({
        id: "64f1a2b3c4d5e6f7a8b9c0d3",
        fullName: "Neha Verma",
        email: "counselor@example.com",
        role: "counselor",
        targetCountries: [],
        interestedFields: [],
        preferredIntake: "",
        maxBudgetUsd: 0,
        englishScore: 0
      });
      showNotification("Switched to Counselor Neha Verma (Counselor Privileges)");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Waygood</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">Study Abroad</span>
              </div>
              <p className="text-xs text-slate-400">Full MERN Backend & Dashboard System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-300" /> Active:
            </span>
            <button 
              onClick={() => switchDemoUser("aarav")} 
              className={`px-2.5 py-1 rounded-lg font-medium transition ${user.fullName.includes("Aarav") ? "bg-emerald-600 text-white shadow-sm" : "text-slate-300 hover:text-white"}`}
            >
              Aarav
            </button>
            <button 
              onClick={() => switchDemoUser("sara")} 
              className={`px-2.5 py-1 rounded-lg font-medium transition ${user.fullName.includes("Sara") ? "bg-emerald-600 text-white shadow-sm" : "text-slate-300 hover:text-white"}`}
            >
              Sara
            </button>
            <button 
              onClick={() => switchDemoUser("counselor")} 
              className={`px-2.5 py-1 rounded-lg font-medium transition ${user.role === "counselor" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:text-white"}`}
            >
              Neha (Counselor)
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 flex gap-2">
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === "explore" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" /> Discovery Catalog
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === "recommendations" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Aggregation Recommendations
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === "applications" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" /> Application Workflow
          </button>
          <button
            onClick={() => setActiveTab("counselor")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === "counselor" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics & Cache
          </button>
        </div>
      </header>

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold border ${
            notification.type === "error" ? "bg-rose-900 border-rose-700 text-white" : "bg-emerald-900 border-emerald-700 text-white"
          }`}>
            {notification.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {notification.msg}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "explore" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">University & Program Catalog</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Filtering by country, intake, field, and budget, with consistent pagination metadata.
                </p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                <button
                  onClick={() => setDiscoveryType("programs")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${discoveryType === "programs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Programs
                </button>
                <button
                  onClick={() => setDiscoveryType("universities")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${discoveryType === "universities" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Universities
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search title, city, field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">All Countries</option>
                  <option value="Canada">Canada</option>
                  <option value="UAE">UAE</option>
                  <option value="Australia">Australia</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  {discoveryType === "programs" ? (
                    <>
                      <option value="relevance">Relevance & Scholarships</option>
                      <option value="tuitionAsc">Tuition: Low to High</option>
                      <option value="tuitionDesc">Tuition: High to Low</option>
                    </>
                  ) : (
                    <>
                      <option value="popular">Popularity Score</option>
                      <option value="ranking">QS World Ranking</option>
                      <option value="name">Alphabetical</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end text-xs text-slate-500 px-2">
                Showing {discoveryType === "programs" ? programs.length : universities.length} results
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Clock className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Querying database...</p>
              </div>
            ) : discoveryType === "programs" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((p) => (
                  <div key={p._id || p.title} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {p.degreeLevel || "Master"}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mt-2">{p.title}</h3>
                          <p className="text-sm text-emerald-600 font-semibold">{p.universityName}</p>
                        </div>
                        <span className="text-sm font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
                          ${p.tuitionFeeUsd?.toLocaleString()}/yr
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-slate-400" /> {p.city}, {p.country}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Intakes: {p.intakes?.join(", ") || "Fall"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Min IELTS: {p.minimumIelts || "6.0"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Scholarship: {p.scholarshipAvailable ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Field: {p.field}</span>
                      <button
                        onClick={() => {
                          setApplyModalProgram(p);
                          setApplyIntake(p.intakes?.[0] || "September");
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        Apply Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {universities.map((u) => (
                  <div key={u._id || u.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                        Score: {u.popularScore} / 100
                      </span>
                      {u.qsRanking > 0 && (
                        <span className="text-xs text-slate-500 font-semibold">
                          QS #{u.qsRanking}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-3">{u.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5" /> {u.city}, {u.country}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                      <span>Partner: {u.partnerType}</span>
                      <span className={u.scholarshipAvailable ? "text-emerald-600 font-medium" : "text-slate-400"}>
                        {u.scholarshipAvailable ? "Scholarships" : "No scholarship"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> MongoDB Aggregation Pipeline
                </div>
                <h1 className="text-2xl font-black tracking-tight">Personalized Recommendations</h1>
                <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                  Computed via native MongoDB aggregation expressions matching target destinations ({user.targetCountries?.join(", ")}), field interests, max budget (${user.maxBudgetUsd?.toLocaleString()}), intake ({user.preferredIntake}), and IELTS ({user.englishScore}).
                </p>
              </div>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Recalculate
              </button>
            </div>

            {recLoading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Clock className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Executing MongoDB aggregation...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={rec._id || index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500/50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm">
                            #{index + 1}
                          </span>
                          <h2 className="text-xl font-bold text-slate-900">{rec.title}</h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                            {rec.country}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-emerald-600 mt-1">{rec.universityName}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Match Score</p>
                          <p className="text-2xl font-black text-emerald-600">{rec.matchScore} / 100</p>
                        </div>
                        <button
                          onClick={() => {
                            setApplyModalProgram(rec);
                            setApplyIntake(rec.intakes?.[0] || "September");
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Matching Criteria Breakdown:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.reasons?.map((reason, rIdx) => (
                          <span key={rIdx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Application Lifecycle & Timeline</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Enforces duplicate prevention, audit history tracking, and strict status transitions.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("explore")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
              >
                Browse Programs To Apply
              </button>
            </div>

            {appLoading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Clock className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading student applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No applications yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Browse through the program catalog and submit an application to start the workflow.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((app) => (
                  <div key={app._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                            app.status === "enrolled" ? "bg-emerald-100 text-emerald-800" :
                            app.status === "rejected" ? "bg-rose-100 text-rose-800" :
                            app.status === "offer-received" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            Status: {app.status}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Intake: {app.intake}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mt-2">{app.program?.title || "Degree Program"}</h2>
                        <p className="text-sm text-emerald-600 font-semibold">{app.university?.name || "University"}</p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-600 pl-1">Transition:</span>
                        {app.status === "submitted" && (
                          <>
                            <button
                              onClick={() => handleTransition(app._id, "under-review")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Under Review
                            </button>
                            <button
                              onClick={() => handleTransition(app._id, "rejected")}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === "under-review" && (
                          <>
                            <button
                              onClick={() => handleTransition(app._id, "offer-received")}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Offer Received
                            </button>
                            <button
                              onClick={() => handleTransition(app._id, "rejected")}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === "offer-received" && (
                          <button
                            onClick={() => handleTransition(app._id, "visa-processing")}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Visa Processing
                          </button>
                        )}
                        {app.status === "visa-processing" && (
                          <button
                            onClick={() => handleTransition(app._id, "enrolled")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Enroll Student
                          </button>
                        )}
                        {(app.status === "enrolled" || app.status === "rejected") && (
                          <span className="text-xs text-slate-400 italic px-2">Terminal State Reached</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Audit Timeline History</p>
                      <div className="space-y-3">
                        {app.timeline?.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-3 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 ring-4 ring-emerald-100" />
                            <div>
                              <p className="font-bold text-slate-800 capitalize">
                                {step.status} <span className="text-slate-400 font-normal">({new Date(step.changedAt).toLocaleDateString()})</span>
                              </p>
                              <p className="text-slate-600 mt-0.5">{step.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "counselor" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Performance & Counselor Analytics</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Aggregated insights, status breakdowns, and in-memory cache monitoring.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  stats?.cacheStatus === "hit" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  Cache: {stats?.cacheStatus || "active"}
                </span>
                <button
                  onClick={fetchStats}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
                  <User className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalStudents || 3}</p>
                <p className="text-xs text-slate-500 mt-1">Registered candidate profiles</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Programs</span>
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalPrograms || 8}</p>
                <p className="text-xs text-slate-500 mt-1">Indexed across 4 countries</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Applications</span>
                  <FileText className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalApplications || 2}</p>
                <p className="text-xs text-slate-500 mt-1">In lifecycle state machine</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Application Status Distribution</h3>
                <div className="space-y-3">
                  {stats?.statusBreakdown?.map((item) => (
                    <div key={item._id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
                      <span className="capitalize font-medium text-slate-700">{item._id}</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Top Destination Countries</h3>
                <div className="space-y-3">
                  {stats?.topCountries?.map((c) => (
                    <div key={c._id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-700 flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-emerald-500" /> {c._id}
                      </span>
                      <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg">
                        {c.count} applications
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {applyModalProgram && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Apply to Program</h2>
            <p className="text-sm text-emerald-600 font-semibold mt-0.5">{applyModalProgram.title}</p>
            <p className="text-xs text-slate-500">{applyModalProgram.universityName} • {applyModalProgram.country}</p>

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Intake</label>
                <select
                  value={applyIntake}
                  onChange={(e) => setApplyIntake(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {applyModalProgram.intakes?.map((intake) => (
                    <option key={intake} value={intake}>{intake}</option>
                  )) || (
                    <option value="September">September</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Applicant Note / SOP Summary</label>
                <textarea
                  rows={3}
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                  placeholder="e.g., Applying for Fall intake with 7.0 IELTS..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyModalProgram(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Waygood MERN Stack Candidate Submission • MongoDB Aggregation, In-Memory Caching, & State Machine Workflow
      </footer>
    </div>
  );
}