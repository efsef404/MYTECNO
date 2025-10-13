import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート

interface ApplicationListProps {
  applications: ApplicationData[];
}

// ステータスに応じたChipの色を決定する関数
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

function ApplicationList({ applications }: ApplicationListProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ p: 2 }}>
        申請一覧
      </Typography>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>申請日</TableCell>
              <TableCell>理由</TableCell>
              <TableCell align="right">ステータス</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow
                key={app.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {app.date}
                </TableCell>
                <TableCell>{app.reason}</TableCell>
                <TableCell align="right">
                  <Chip label={app.status} color={getStatusChipColor(app.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default ApplicationList;
