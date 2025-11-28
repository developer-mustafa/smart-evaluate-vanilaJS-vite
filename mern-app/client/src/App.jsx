import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './contexts/ThemeContext';
import { Suspense, lazy } from 'react';
import LoadingFallback from './components/LoadingFallback';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy load only heavy pages - keep Dashboard loaded for better UX
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Groups = lazy(() => import('./pages/Groups'));
const Members = lazy(() => import('./pages/Members'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Evaluations = lazy(() => import('./pages/Evaluations'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const StudentFilter = lazy(() => import('./pages/StudentFilter'));
const Analysis = lazy(() => import('./pages/Analysis'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const StudentsDirectory = lazy(() => import('./pages/StudentsDirectory'));
const Assignments = lazy(() => import('./pages/Assignments'));

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="groups" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Groups />
                </Suspense>
              } />
              <Route path="members" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Members />
                </Suspense>
              } />
              <Route path="tasks" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Tasks />
                </Suspense>
              } />
              <Route path="evaluations" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LoadingFallback type="skeleton" />}>
                    <Evaluations />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="ranking" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Ranking />
                </Suspense>
              } />
              <Route path="statistics" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Statistics />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Settings />
                </Suspense>
              } />
              <Route path="student-filter" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <StudentFilter />
                </Suspense>
              } />
              
              {/* Analysis Routes */}
              <Route path="analysis" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Analysis />
                </Suspense>
              } />
              <Route path="group-analysis" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Analysis />
                </Suspense>
              } />
              <Route path="graph-analysis" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Analysis />
                </Suspense>
              } />
              
              {/* Placeholder Routes for Missing Pages */}
              <Route path="assignments" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <Assignments />
                </Suspense>
              } />
              <Route path="upcoming-assignments" element={<Navigate to="/assignments" replace />} />
              <Route path="students" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <StudentsDirectory />
                </Suspense>
              } />
              <Route path="group-policy" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <PlaceholderPage 
                    title="গ্রুপ পলিসি" 
                    icon="fas fa-book" 
                    description="গ্রুপ পরিচালনার নীতিমালা শীঘ্রই এখানে দেখা যাবে।" 
                  />
                </Suspense>
              } />
              <Route path="export" element={
                <Suspense fallback={<LoadingFallback type="skeleton" />}>
                  <PlaceholderPage 
                    title="এক্সপোর্ট" 
                    icon="fas fa-file-export" 
                    description="ডাটা এক্সপোর্ট করার সুবিধা শীঘ্রই চালু হবে।" 
                  />
                </Suspense>
              } />
              <Route path="admin-management" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LoadingFallback type="skeleton" />}>
                    <PlaceholderPage 
                      title="অ্যাডমিন ম্যানেজমেন্ট" 
                      icon="fas fa-user-shield" 
                      description="অ্যাডমিন এবং অনুমতি ব্যবস্থাপনা শীঘ্রই এখানে যুক্ত করা হবে।" 
                    />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
