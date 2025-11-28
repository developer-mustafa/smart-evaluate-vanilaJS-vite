import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarVisibility, toggleSidebarType, toggleDashboardSection, resetSettings } from '../store/settingsSlice';
import { Switch } from "../components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { useTheme } from '../contexts/ThemeContext';
import { THEME_COLORS } from '../config/themeConfig';

export default function Settings() {
  const dispatch = useDispatch();
  const { sidebar, dashboardSections, colorTheme } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const { themeMode, setTheme, setColor } = useTheme();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 font-bold">আপনার এই পেজটি দেখার অনুমতি নেই।</div>
      </div>
    );
  }

  const handleSidebarVisibility = (path, visible) => {
    dispatch(toggleSidebarVisibility({ path, visible }));
  };

  const handleSidebarType = (path) => {
    dispatch(toggleSidebarType({ path }));
  };

  const handleDashboardSection = (section, visible) => {
    dispatch(toggleDashboardSection({ section, visible }));
  };

  const dashboardToggles = [
    { key: 'hero', title: 'হিরো সেকশন', subtitle: 'স্বাগতম বার্তা এবং স্কোর কার্ড', icon: 'fa-star', color: 'text-indigo-600' },
    { key: 'stats', title: 'পরিসংখ্যান গ্রিড', subtitle: 'মোট গ্রুপ, শিক্ষার্থী এবং অন্যান্য তথ্য', icon: 'fa-chart-pie', color: 'text-blue-600' },
    { key: 'topGroups', title: 'এলিট গ্রুপ (শীর্ষ ৩)', subtitle: 'সেরা ৩টি গ্রুপ হাইলাইট করুন', icon: 'fa-crown', color: 'text-yellow-600' },
    { key: 'academicStats', title: 'একাডেমিক স্ট্যাটাস', subtitle: 'শাখাভিত্তিক পারফরম্যান্স', icon: 'fa-university', color: 'text-sky-600' },
    { key: 'ranking', title: 'গ্রুপ র‍্যাঙ্কিং', subtitle: 'সকল গ্রুপের বিস্তারিত র‍্যাঙ্কিং', icon: 'fa-list-ol', color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          অ্যাপ্লিকেশন কনফিগারেশন
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          আপনার ড্যাশবোর্ড এবং মেনু পছন্দমত সাজিয়ে নিন।
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sidebar Management (Left - Wider) */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <i className="fas fa-bars"></i>
              </div>
              <div>
                <CardTitle>মেনু ব্যবস্থাপনা</CardTitle>
                <CardDescription>সাইডবার মেনু আইটেমগুলো কাস্টমাইজ করুন</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>মেনু আইটেম</TableHead>
                    <TableHead className="text-center">দৃশ্যমানতা</TableHead>
                    <TableHead className="text-center">এক্সেস টাইপ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(sidebar).map(([path, item]) => (
                    <TableRow key={path}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <i className={item.icon}></i>
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.visible}
                          disabled={item.locked}
                          onCheckedChange={(checked) => handleSidebarVisibility(path, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={item.locked}
                          onClick={() => handleSidebarType(path)}
                          className={item.type === 'private' ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20'}
                        >
                          <i className={`fas ${item.type === 'private' ? 'fa-lock' : 'fa-globe'} mr-2`}></i>
                          {item.type === 'private' ? 'প্রাইভেট' : 'পাবলিক'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end p-4 bg-gray-50/50 dark:bg-gray-800/50">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('আপনি কি নিশ্চিত যে আপনি সমস্ত সেটিংস ডিফল্ট অবস্থায় ফিরিয়ে আনতে চান?')) {
                    dispatch(resetSettings());
                  }
                }}
              >
                <i className="fas fa-undo mr-2"></i>
                ডিফল্ট সেটিংস রিসেট করুন
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Dashboard & Other Settings (Right) */}
        <div className="space-y-6">
          {/* Dashboard Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <div>
                <CardTitle>ড্যাশবোর্ড সেকশন</CardTitle>
                <CardDescription>ড্যাশবোর্ডের কন্টেন্ট নিয়ন্ত্রণ করুন</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardToggles.map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${toggle.color}`}>
                      <i className={`fas ${toggle.icon}`}></i>
                    </div>
                    <div>
                      <Label className="font-semibold text-base">{toggle.title}</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{toggle.subtitle}</p>
                    </div>
                  </div>
                  <Switch
                    checked={dashboardSections[toggle.key]}
                    onCheckedChange={(checked) => handleDashboardSection(toggle.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <i className="fas fa-palette"></i>
              </div>
              <div>
                <CardTitle>থিম এবং রূপরেখা</CardTitle>
                <CardDescription>লাইট/ডার্ক মোড এবং রঙ থিম নির্বাচন করুন</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Mode */}
              <div>
                <Label className="font-semibold text-base mb-3 block">থিম মোড</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        themeMode === mode
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className={`fas ${
                          mode === 'light' ? 'fa-sun' :
                          mode === 'dark' ? 'fa-moon' :
                          'fa-circle-half-stroke'
                        } text-xl ${themeMode === mode ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}></i>
                        <span className="text-sm font-medium">
                          {mode === 'light' ? 'লাইট' : mode === 'dark' ? 'ডার্ক' : 'সিস্টেম'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <Label className="font-semibold text-base mb-3 block">রঙ থিম</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(THEME_COLORS).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setColor(key)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        colorTheme === key
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex gap-1.5 h-6">
                          <div className="flex-1 rounded" style={{ backgroundColor: theme.preview.primary }}></div>
                          <div className="flex-1 rounded" style={{ backgroundColor: theme.preview.secondary }}></div>
                          <div className="flex-1 rounded" style={{ backgroundColor: theme.preview.accent }}></div>
                        </div>
                        <span className="text-sm font-medium block text-center">{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Info Card */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30">
            <i className="fas fa-info-circle h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 ml-2">গুরুত্বপূর্ণ তথ্য</AlertTitle>
            <AlertDescription className="text-blue-700/80 dark:text-blue-300/70 ml-6">
              'প্রাইভেট' হিসেবে মার্ক করা পেজগুলো শুধুমাত্র অ্যাডমিনরা দেখতে পাবেন। 'পাবলিক' পেজগুলো লগইন করা বা না করা সকল ব্যবহারকারী দেখতে পাবেন।
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
