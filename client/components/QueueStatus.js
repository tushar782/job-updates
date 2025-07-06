'use client';

import { useState, useEffect } from 'react';
import apiService from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const QueueStatus = () => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQueueStatus();
      setQueueData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching queue status:', error);
      setError('Failed to fetch queue status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchQueueStatus, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'active':
        return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-600" />;
    }
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  };

  if (loading && !queueData) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading queue status..." />
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

  const statusData = [
    { name: 'Waiting', value: queueData?.waiting || 0, status: 'waiting' },
    { name: 'Active', value: queueData?.active || 0, status: 'active' },
    { name: 'Completed', value: queueData?.completed || 0, status: 'completed' },
    { name: 'Failed', value: queueData?.failed || 0, status: 'failed' }
  ];

  const totalJobs = queueData?.total || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Queue Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto-refresh
              </label>
            </div>
            <button
              onClick={fetchQueueStatus}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Queue status updates automatically every 5 seconds when auto-refresh is enabled.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusData.map((item) => (
          <div key={item.status} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(item.value, totalJobs)}% of total
                </p>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(item.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Jobs Overview */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Total Jobs: {totalJobs}</h3>
        
        {totalJobs > 0 ? (
          <div className="space-y-3">
            {statusData.map((item) => (
              <div key={item.status} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.value} ({calculatePercentage(item.value, totalJobs)}%)</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                      style={{ width: `${calculatePercentage(item.value, totalJobs)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs in queue</p>
          </div>
        )}
      </div>

      {/* Queue Health Status */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Health</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              queueData?.active > 0 ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-700">Processing</p>
              <p className="text-xs text-gray-500">
                {queueData?.active > 0 ? 'Jobs are being processed' : 'No active jobs'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              queueData?.waiting > 0 ? 'bg-yellow-500' : 'bg-gray-300'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-700">Pending</p>
              <p className="text-xs text-gray-500">
                {queueData?.waiting > 0 ? `${queueData.waiting} jobs waiting` : 'No pending jobs'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              queueData?.failed > 0 ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-xs text-gray-500">
                {queueData?.failed > 0 ? `${queueData.failed} failed jobs` : 'All jobs healthy'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;