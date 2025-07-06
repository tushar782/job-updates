'use client';

import { useState } from 'react';
import JobFeed from '../../components/JobFeed';
import ImportHistoryTable from '../../components/ImportHistoryTable';
import ImportControls from '../../components/ImportControls';
import QueueStatus from '../../components/QueueStatus';

export default function Home() {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabs = [
    { id: 'jobs', label: 'Job Feed', icon: '💼' },
    { id: 'import', label: 'Import Jobs', icon: '📥' },
    { id: 'history', label: 'Import History', icon: '📊' },
    { id: 'queue', label: 'Queue Status', icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h5 className="text-2xl font-bold text-gray-900 mb-2">
            Job Import System
          </h5>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'jobs' && <JobFeed />}
          {activeTab === 'import' && <ImportControls />}
          {activeTab === 'history' && <ImportHistoryTable />}
          {activeTab === 'queue' && <QueueStatus />}
        </div>
      </div>
    </div>
  );
}