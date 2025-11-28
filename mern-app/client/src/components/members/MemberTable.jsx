import { useState } from 'react';
import StudentDetailModal from '../modals/StudentDetailModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

export default function MemberTable({ members, onEdit, onDelete }) {
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (members.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <i className="fa fa-users text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400">কোনো সদস্য পাওয়া যায়নি</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">নাম</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead>গ্রুপ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                {(onEdit || onDelete) && (
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">
                    <button 
                      onClick={() => setSelectedStudent(member)}
                      className="hover:underline text-left"
                    >
                      {member.name}
                    </button>
                  </TableCell>
                  <TableCell>{member.email || '-'}</TableCell>
                  <TableCell className="font-mono">{member.roll || '-'}</TableCell>
                  <TableCell>{member.group?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "default" : "secondary"} className={member.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" : ""}>
                      {member.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(member)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          >
                            <i className="fa fa-edit"></i>
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(member._id)}
                            className="h-8 w-8 text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          >
                            <i className="fa fa-trash"></i>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </>
  );
}
