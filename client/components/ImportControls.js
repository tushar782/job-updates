'use client';

import { useState, useEffect } from 'react';
import apiService from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Play, Download, RefreshCw } from 'lucide-react';

const ImportControls = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [sources, setSources] = useState(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await apiService.getApiEndpoints();
      setEndpoints(response.data.endpoints || []);
      setSources(response.data.sources || {});
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      setMessage('Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleEndpointToggle = (url) => {
    setSelectedEndpoints(prev => 
      prev.includes(url) 
        ? prev.filter(e => e !== url)
        : [...prev, url]
    );
  };

  const handleSelectAll = () => {
    if (selectedEndpoints.length === endpoints.length) {
      setSelectedEndpoints([]);
    } else {
      setSelectedEndpoints(endpoints.map(e => e.url));
    }
  };

  const handleStartImport = async () => {
    if (selectedEndpoints.length === 0) {
      setMessage('Please select at least one endpoint');
      return;
    }

    try {
      setImporting(true);
      setMessage('');
      
      const response = await apiService.startImport(selectedEndpoints);
      setMessage(`✅ ${response.message}`);
      setSelectedEndpoints([]);
    } catch (error) {
      console.error('Error starting import:', error);
      setMessage('❌ Failed to start import');
    } finally {
      setImporting(false);
    }
  };

  const handleAutoImport = async () => {
    try {
      setImporting(true);
      setMessage('');
      
      const response = await apiService.startAutoImport();
      setMessage(`✅ ${response.message}`);
    } catch (error) {
      console.error('Error starting auto import:', error);
      setMessage('❌ Failed to start auto import');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading endpoints..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Import Job Data
        </h2>
        <p className="text-gray-600">
          Select endpoints to import job data from external APIs
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleAutoImport}
          disabled={importing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Import All Sources</span>
          {importing && <RefreshCw size={16} className="animate-spin" />}
        </button>
        
        <button
          onClick={handleStartImport}
          disabled={importing || selectedEndpoints.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={16} />
          <span>Import Selected ({selectedEndpoints.length})</span>
          {importing && <RefreshCw size={16} className="animate-spin" />}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Endpoint Selection */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Available Endpoints ({endpoints.length})
            </h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedEndpoints.length === endpoints.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="divide-y">
          {endpoints.map((endpoint) => (
            <div key={endpoint.url} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEndpoints.includes(endpoint.url)}
                    onChange={() => handleEndpointToggle(endpoint.url)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {endpoint.name || 'Unnamed Endpoint'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {endpoint.description || 'No description available'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {endpoint.url}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    endpoint.source === 'jobicy' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {endpoint.source || 'unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources Summary */}
      {sources && Object.keys(sources).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sources).map(([source, count]) => (
              <span key={source} className="px-3 py-1 bg-white text-sm rounded-full border">
                {String(source)}: {String(count)} endpoints
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportControls;