import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import type { ApplicationData } from '../App';

interface ApprovalPageProps {
  applications: ApplicationData[];
  updateApplicationStatus: (id: number, newStatus: ApplicationData['status']) => void;
}

const getStatusChipColor = (status: ApplicationData['status']) => {
  switch (status) {
    case '承認':
      return 'success';
    case '否認':
      return 'error';
    case '申請中':
      return 'warning';
    default:
      return 'default';
  }
};

function ApprovalPage({ applications, updateApplicationStatus }: ApprovalPageProps) {
  const pendingApplications = applications.filter(app => app.status === '申請中');

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        申請承認
      </Typography>
      {pendingApplications.length === 0 ? (
        <Typography>承認待ちの申請はありません。</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>申請日</TableCell>
                <TableCell>理由</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="right">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.id}</TableCell>
                  <TableCell>{app.date}</TableCell>
                  <TableCell>{app.reason}</TableCell>
                  <TableCell>
                    <Chip label={app.status} color={getStatusChipColor(app.status)} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                      onClick={() => updateApplicationStatus(app.id, '承認')}
                    >
                      承認
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => updateApplicationStatus(app.id, '否認')}
                    >
                      否認
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default ApprovalPage;
