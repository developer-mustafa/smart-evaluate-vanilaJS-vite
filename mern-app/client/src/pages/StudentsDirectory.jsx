import { useState } from 'react';
import { useGetMembersQuery } from '../services/api';
import MemberTable from '../components/members/MemberTable';
import { Input } from "../components/ui/input"
import { Card, CardContent } from "../components/ui/card"

export default function StudentsDirectory() {
  const [filters, setFilters] = useState({ groupId: '', search: '' });
  const { data: membersData, isLoading } = useGetMembersQuery(filters);
  const members = membersData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          শিক্ষার্থী তথ্য
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          মোট শিক্ষার্থী: {membersData?.count || 0}
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"></i>
              <Input
                type="text"
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table (Read Only) */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <MemberTable
          members={members}
          // No onEdit or onDelete props passed, making it read-only
        />
      )}
    </div>
  );
}
