'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, getAllStressData, getCompletedStudyUsers, type UserData, type StressDataWithUser } from '@/services/admin-data-service';
import { exportToCSV } from '@/lib/csv-export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Database } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [stressData, setStressData] = useState<StressDataWithUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stressDataResult, completedUsersResult] = await Promise.all([
        getAllStressData(),
        getCompletedStudyUsers(),
      ]);
      setStressData(stressDataResult);
      setCompletedUsers(completedUsersResult);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please check your permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportResearchData = () => {
    if (stressData.length === 0) {
      toast({
        title: 'No Data',
        description: 'There is no research data to export.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data for CSV export
    const csvData = stressData.map(row => ({
      'Memorable Codeword': row.memorableCodeWord || row.participantId,
      'Study Day': row.studyDay || 'N/A',
      'Affirmation Number': row.affirmationNumber !== undefined ? row.affirmationNumber : 'N/A',
      'Date': row.date,
      'Time': row.time,
      'Affirmation Type': row.affirmationType,
      'Affirmation': row.affirmation,
      'Mood Pre': row.stressBefore,
      'Mood Post': row.stressAfter,
      'Time Spent (sec)': row.timeSpentSeconds,
    }));

    const filename = `research-data-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(csvData, filename);

    toast({
      title: 'Export Successful',
      description: `Downloaded ${stressData.length} records to ${filename}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stressData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed 7-Day Study</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users ready for contact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Users Table */}
      {completedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Study Participants</CardTitle>
            <CardDescription>Users who have completed 7 days of the study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Memorable Codeword</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Study Start Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.memorableCodeWord || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.studyStartDate
                          ? new Date(user.studyStartDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Research Data</CardTitle>
              <CardDescription>All affirmation session data</CardDescription>
            </div>
            <Button onClick={handleExportResearchData} className="gap-2">
              <Download className="h-4 w-4" />
              Export Research Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Memorable Codeword</TableHead>
                  <TableHead className="text-center">Day</TableHead>
                  <TableHead className="text-center">#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Affirmation</TableHead>
                  <TableHead className="text-center">Mood Pre</TableHead>
                  <TableHead className="text-center">Mood Post</TableHead>
                  <TableHead className="text-right">Time (sec)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stressData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No research data found
                    </TableCell>
                  </TableRow>
                ) : (
                  stressData.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.participantId}</TableCell>
                      <TableCell className="text-center">{entry.studyDay || '-'}</TableCell>
                      <TableCell className="text-center">{entry.affirmationNumber !== undefined ? entry.affirmationNumber : '-'}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell className="capitalize">{entry.affirmationType}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {entry.affirmation}
                      </TableCell>
                      <TableCell className="text-center">{entry.stressBefore}</TableCell>
                      <TableCell className="text-center">{entry.stressAfter}</TableCell>
                      <TableCell className="text-right">{entry.timeSpentSeconds}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
