import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import type { ApplicationData } from '../App';

interface ManagementPageProps {
  applications: ApplicationData[];
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

function ManagementPage({ applications }: ManagementPageProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        申請管理
      </Typography>
      {applications.length === 0 ? (
        <Typography>申請履歴はありません。</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>申請日</TableCell>
                <TableCell>理由</TableCell>
                <TableCell align="right">ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.id}</TableCell>
                  <TableCell>{app.date}</TableCell>
                  <TableCell>{app.reason}</TableCell>
                  <TableCell align="right">
                    <Chip label={app.status} color={getStatusChipColor(app.status)} />
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

export default ManagementPage;
