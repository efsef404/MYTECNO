import React from 'react';
import { Box } from '@mui/material';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';
import type { ApplicationData } from '../App';

interface ApplicationPageProps {
  addApplication: (reason: string, date: string) => void;
  applications: ApplicationData[];
}

function ApplicationPage({ addApplication, applications }: ApplicationPageProps) {
  return (
    <Box>
      <ApplicationForm addApplication={addApplication} />
      <Box sx={{ mt: 5 }}>
        <ApplicationList applications={applications} />
      </Box>
    </Box>
  );
}

export default ApplicationPage;
