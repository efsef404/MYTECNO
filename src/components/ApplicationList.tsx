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
import { Button } from '@mui/material'; // Buttonをインポート
import dayjs from 'dayjs'; // dayjsをインポート
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート

interface ApplicationListProps {
  applications: ApplicationData[];
  updateApplicationStatus?: (id: number, newStatus: ApplicationData['status']) => void; // オプショナルにする
  selectedTab?: 'pending' | 'processed'; // オプショナルにする
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

function ApplicationList({ applications, updateApplicationStatus, selectedTab }: ApplicationListProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ p: 2 }}>
        申請一覧
      </Typography>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
                          <TableRow>
                            <TableCell>申請日</TableCell> {/* 新しく追加された申請日 */}
                            <TableCell>申請希望日</TableCell> {/* 既存のdateがこれに変わる */}
                            <TableCell>申請者</TableCell>
                            <TableCell>理由</TableCell>
                            <TableCell>特認</TableCell> {/* 特認カラムを追加 */}
                            <TableCell>ステータス</TableCell>
                            <TableCell>処理日</TableCell>
                            {selectedTab === 'pending' && <TableCell align="right">アクション</TableCell>} {/* pendingタブの場合のみ表示 */}
                          </TableRow>
                        </TableHead>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow
                            key={app.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">{app.applicationDate ? dayjs(app.applicationDate).format('MM/DD HH:mm') : '-'}</TableCell> {/* 新しく追加された申請日を表示 */}
                            <TableCell>{app.requestedDate ? dayjs(app.requestedDate).format('MM/DD') : '-'}</TableCell> {/* 申請希望日を表示 */}
                            <TableCell>{app.username}</TableCell>
                            <TableCell>{app.reason}</TableCell>
                            <TableCell>{!!app.isSpecialApproval && <Chip label="特認" color="error" variant="filled" size="small" />}</TableCell> {/* 特認表示 */}
                            <TableCell><Chip label={app.status} color={getStatusChipColor(app.status)} /></TableCell>
                            <TableCell>{app.processedAt ? dayjs(app.processedAt).format('MM/DD HH:mm') : '-'}</TableCell>
                            {selectedTab === 'pending' && app.status === '申請中' && updateApplicationStatus && (
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
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              );
            }
export default ApplicationList;
