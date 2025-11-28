import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-background justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hidden md:block">স্মার্ট ইভ্যালুয়েট সিস্টেম</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <Badge variant="outline" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700">টাস্ক স্কোর</Badge>
            <Badge variant="outline" className="bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100 border-sky-200 dark:border-sky-700">টিম স্কোর</Badge>
            <Badge variant="outline" className="bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100 border-rose-200 dark:border-rose-700">অতিরিক্ত স্কোর</Badge>
            <Badge variant="outline" className="bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100 border-amber-200 dark:border-amber-700">MCQ স্কোর</Badge>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
