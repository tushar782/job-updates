'use client';

import { useState, useEffect } from 'react';
import apiService from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import StatusBadge from './StatusBadge';
import { formatDate } from '../lib/utils';
import { ChevronLeft, ChevronRight, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

const ImportHistoryTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchHistory = async (page = 1, source = '') => {
    try {
      setLoading(true);
      const response = await apiService.getImportHistory(page, 10, source);
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
      setError(null);
    } catch (error) {
      console.error('Error fetching import history:', error);
      setError('Failed to fetch import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, selectedSource);
  }, [selectedSource]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchHistory(page, selectedSource);
    }
  };

  const handleViewDetails = async (log) => {
    try {
      const response = await apiService.getImportLogDetails(log._id);
      setSelectedLog(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching log details:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading import history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Import History</h2>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            <option value="jobicy">Jobicy</option>
            <option value="higheredjobs">Higher Ed Jobs</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jobs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(log.status)}
                    <StatusBadge status={log.status} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${log.source === 'jobicy'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                      }`}>
                      {log.source}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div>Fetched: {log.totalFetched || 0}</div>
                    <div className="text-xs text-gray-500">
                      New: {log.newJobs || 0} | Updated: {log.updatedJobs || 0}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(log.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.startTime || log.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(log)}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Import Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedLog.source === 'jobicy'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-indigo-100 text-indigo-800'
                    }`}>
                    {selectedLog.source}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Fetched</label>
                  <p className="text-sm text-gray-900">{selectedLog.totalFetched || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Imported</label>
                  <p className="text-sm text-gray-900">{selectedLog.totalImported || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Jobs</label>
                  <p className="text-sm text-gray-900">{selectedLog.newJobs || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated Jobs</label>
                  <p className="text-sm text-gray-900">{selectedLog.updatedJobs || 0}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Source URL</label>
                <p className="text-sm text-gray-900 break-all">{selectedLog.sourceUrl}</p>
              </div>

              {selectedLog.errorMessage && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Error Message</label>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedLog.errorMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.startTime || selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="text-sm text-gray-900">{formatDuration(selectedLog.duration)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportHistoryTable;